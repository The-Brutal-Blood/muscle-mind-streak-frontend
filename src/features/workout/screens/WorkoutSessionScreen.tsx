import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PlusIcon } from '@/components/icons/ActionIcons';
import { Button, Loader, Screen, Text } from '@/components/ui';
import { getLatestExerciseHistory } from '@/features/exercises/services/exercise.service';
import type { Exercise } from '@/features/exercises/types/exercise.types';
import {
  clearWorkoutSession,
  saveWorkoutSession,
  loadWorkoutSession,
} from '@/storage/workoutSession.storage';
import { colors, radius, spacing } from '@/theme';

import { RestTimerBar } from '../components/RestTimerBar';
import { RestTimerSheet } from '../components/RestTimerSheet';
import { WorkoutExerciseCard } from '../components/WorkoutExerciseCard';
import { WorkoutHeader } from '../components/WorkoutHeader';
import { useElapsedSeconds, WorkoutTimer } from '../components/WorkoutTimer';
import { useRestCountdown } from '../hooks/useRestCountdown';
import {
  useDiscardWorkoutSession,
  useFinishWorkoutSession,
} from '../hooks/useWorkoutSession';
import type { WorkoutExerciseState, WorkoutSessionState } from '../types/workout.types';
import {
  buildFinishPayload,
  computeVolume,
  countCompletedSets,
  createEmptySet,
  hasAnySetValues,
  LOCAL_EXERCISE_ID_PREFIX,
  LOCAL_SET_ID_PREFIX,
} from '../utils/workoutSession';

export interface WorkoutSessionScreenProps {
  /** The freshly-started session; absent means resume from storage. */
  initialState?: WorkoutSessionState;
  /** Exercises returned by the Add Exercise flow; appended to the session. */
  addedExercises?: Exercise[];
  /** Minimizes the session (kept in storage). Navigation owned by caller. */
  onBack: () => void;
  /** Fired after a successful finish. Navigation owned by caller. */
  onFinished: () => void;
  /** Fired after a successful discard. Navigation owned by caller. */
  onDiscarded: () => void;
  /** Opens the exercise library. Navigation owned by caller. */
  onAddExercise: () => void;
}

const PERSIST_INTERVAL_MS = 30000;

export const WorkoutSessionScreen = React.memo(function WorkoutSessionScreenBase({
  initialState,
  addedExercises,
  onBack,
  onFinished,
  onDiscarded,
  onAddExercise,
}: WorkoutSessionScreenProps) {
  const [state, setState] = useState<WorkoutSessionState | null>(initialState ?? null);
  const [restoring, setRestoring] = useState(!initialState);
  // workoutExerciseId whose rest-timer picker is open, or null when closed.
  const [restSheetFor, setRestSheetFor] = useState<string | null>(null);

  const finishMutation = useFinishWorkoutSession();
  const discardMutation = useDiscardWorkoutSession();
  const busy = finishMutation.isPending || discardMutation.isPending;

  // Between-sets rest countdown, started when a set is marked complete.
  const rest = useRestCountdown();

  // Monotonic ids for locally-added exercises/sets (no server id yet).
  const exSeq = useRef(0);
  const setSeq = useRef(0);

  // Latest state for the persistence handlers (interval / background / unmount).
  const stateRef = useRef(state);
  stateRef.current = state;
  // Once finished/discarded, storage is cleared — never re-persist on unmount.
  const finishedRef = useRef(false);
  const persist = useCallback(() => {
    if (finishedRef.current || !stateRef.current) {
      return;
    }
    saveWorkoutSession(stateRef.current);
  }, []);

  // Seed: persist a fresh start immediately, or restore an in-progress one.
  useEffect(() => {
    if (initialState) {
      saveWorkoutSession(initialState);
      return;
    }
    let active = true;
    loadWorkoutSession().then(loaded => {
      if (active) {
        setState(loaded);
        setRestoring(false);
      }
    });
    return () => {
      active = false;
    };
  }, [initialState]);

  // Offline safety: persist every 30s, on background, and on unmount.
  useEffect(() => {
    const interval = setInterval(persist, PERSIST_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'background' || next === 'inactive') {
        persist();
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
      persist();
    };
  }, [persist]);

  // Merge exercises returned by the Add Exercise flow (dedup by exerciseId).
  useEffect(() => {
    if (!addedExercises || addedExercises.length === 0) {
      return;
    }
    setState(current => {
      if (!current) {
        return current;
      }
      const known = new Set(current.exercises.map(exercise => exercise.exerciseId));
      const fresh = addedExercises.filter(exercise => !known.has(exercise.id));
      if (fresh.length === 0) {
        return current;
      }
      const additions: WorkoutExerciseState[] = fresh.map(exercise => ({
        workoutExerciseId: `${LOCAL_EXERCISE_ID_PREFIX}${exSeq.current++}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        imageUrl: exercise.imageUrl,
        restTimerSeconds: null,
        notes: '',
        previousSets: [],
        sets: [createEmptySet(`${LOCAL_SET_ID_PREFIX}${setSeq.current++}`, 1)],
      }));
      return { ...current, exercises: [...current.exercises, ...additions] };
    });

    // Backfill the PREVIOUS column without blocking the UI: the exercise is
    // already visible with empty history; fill it in when the fetch lands.
    // A failure just leaves previousSets empty (rendered as "-").
    addedExercises.forEach(exercise => {
      getLatestExerciseHistory(exercise.id)
        .then(history => {
          if (history.sets.length === 0) {
            return;
          }
          const previousSets = history.sets.map(set => ({
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
          }));
          setState(current =>
            current
              ? {
                  ...current,
                  exercises: current.exercises.map(item =>
                    item.exerciseId === exercise.id && item.previousSets.length === 0
                      ? { ...item, previousSets }
                      : item,
                  ),
                }
              : current,
          );
        })
        .catch(() => {
          // Keep the exercise; PREVIOUS stays "-".
        });
    });
  }, [addedExercises]);

  const updateExercise = useCallback(
    (exerciseId: string, updater: (exercise: WorkoutExerciseState) => WorkoutExerciseState) => {
      setState(current =>
        current
          ? {
              ...current,
              exercises: current.exercises.map(exercise =>
                exercise.workoutExerciseId === exerciseId ? updater(exercise) : exercise,
              ),
            }
          : current,
      );
    },
    [],
  );

  const handleChangeNotes = useCallback(
    (exerciseId: string, notes: string) =>
      updateExercise(exerciseId, exercise => ({ ...exercise, notes })),
    [updateExercise],
  );

  const handleChangeRestTimer = useCallback(
    (exerciseId: string, restTimerSeconds: number | null) =>
      updateExercise(exerciseId, exercise => ({ ...exercise, restTimerSeconds })),
    [updateExercise],
  );

  const handleChangeSet = useCallback(
    (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) =>
      updateExercise(exerciseId, exercise => ({
        ...exercise,
        sets: exercise.sets.map(set =>
          set.workoutSetId === setId ? { ...set, [field]: value, prefilled: false } : set,
        ),
      })),
    [updateExercise],
  );

  const startRest = rest.start;
  const handleToggleSet = useCallback(
    (exerciseId: string, setId: string) => {
      const exercise = stateRef.current?.exercises.find(
        item => item.workoutExerciseId === exerciseId,
      );
      const set = exercise?.sets.find(item => item.workoutSetId === setId);
      const willComplete = set ? !set.completed : false;

      updateExercise(exerciseId, current => ({
        ...current,
        sets: current.sets.map(item =>
          item.workoutSetId === setId
            ? { ...item, completed: !item.completed, prefilled: false }
            : item,
        ),
      }));

      // Kick off the rest countdown only when completing a set on an exercise
      // that has a rest timer configured.
      if (willComplete && exercise?.restTimerSeconds && exercise.restTimerSeconds > 0) {
        startRest(exercise.restTimerSeconds);
      }
    },
    [updateExercise, startRest],
  );

  const handleAddSet = useCallback(
    (exerciseId: string) =>
      updateExercise(exerciseId, exercise => {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const nextNumber = (lastSet?.setNumber ?? 0) + 1;
        const fresh = createEmptySet(`${LOCAL_SET_ID_PREFIX}${setSeq.current++}`, nextNumber);
        // Carry the last set's values forward as a dimmed suggestion.
        const hasCarryOver = Boolean(lastSet && (lastSet.weight !== '' || lastSet.reps !== ''));
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            hasCarryOver
              ? { ...fresh, weight: lastSet!.weight, reps: lastSet!.reps, prefilled: true }
              : fresh,
          ],
        };
      }),
    [updateExercise],
  );

  const handleRemoveSet = useCallback(
    (exerciseId: string, setId: string) =>
      updateExercise(exerciseId, exercise => ({
        ...exercise,
        sets: exercise.sets.filter(set => set.workoutSetId !== setId),
      })),
    [updateExercise],
  );

  const handleRemoveExercise = useCallback((exerciseId: string) => {
    setState(current =>
      current
        ? {
            ...current,
            exercises: current.exercises.filter(
              exercise => exercise.workoutExerciseId !== exerciseId,
            ),
          }
        : current,
    );
  }, []);

  const volume = useMemo(() => (state ? computeVolume(state) : 0), [state]);
  const completedSets = useMemo(() => (state ? countCompletedSets(state) : 0), [state]);
  const elapsed = useElapsedSeconds(state?.startedAt ?? '');
  const restSheetExercise = restSheetFor
    ? state?.exercises.find(exercise => exercise.workoutExerciseId === restSheetFor)
    : undefined;

  const submitFinish = useCallback(() => {
    const current = stateRef.current;
    if (!current || finishMutation.isPending) {
      return;
    }
    if (!hasAnySetValues(current)) {
      Alert.alert('Cannot Finish Workout', 'Your workout has no set values.');
      return;
    }
    const durationSeconds = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(current.startedAt)) / 1000),
    );
    const payload = buildFinishPayload(current, durationSeconds);
    finishMutation.mutate(
      { sessionId: current.sessionId, payload },
      {
        onSuccess: async () => {
          finishedRef.current = true;
          await clearWorkoutSession();
          onFinished();
        },
        onError: error =>
          Alert.alert('Could not finish workout', error.message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: submitFinish },
          ]),
      },
    );
  }, [finishMutation, onFinished]);

  const submitDiscard = useCallback(() => {
    const current = stateRef.current;
    if (!current) {
      onDiscarded();
      return;
    }
    discardMutation.mutate(current.sessionId, {
      onSuccess: async () => {
        finishedRef.current = true;
        await clearWorkoutSession();
        onDiscarded();
      },
      onError: error =>
        Alert.alert('Could not discard workout', error.message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: submitDiscard },
        ]),
    });
  }, [discardMutation, onDiscarded]);

  const confirmDiscard = () => {
    Alert.alert('Discard Workout?', 'This workout will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: submitDiscard },
    ]);
  };

  const handleBack = () => {
    persist();
    onBack();
  };

  const handleAddExercise = () => {
    persist();
    onAddExercise();
  };

  if (restoring) {
    return (
      <Screen padded={false}>
        <Loader fullscreen />
      </Screen>
    );
  }

  if (!state) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <Text variant="subtitle" color="textSecondary" align="center">
            No active workout
          </Text>
          <Button
            label="Go Back"
            variant="outline"
            size="md"
            onPress={onBack}
            accessibilityLabel="Go Back"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <WorkoutHeader
        title="Log Workout"
        finishing={finishMutation.isPending}
        onBack={handleBack}
        onFinish={submitFinish}
      />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text variant="label" color="textSecondary" style={styles.statLabel}>
            Duration
          </Text>
          <WorkoutTimer seconds={elapsed} variant="headingM" color="primary" />
        </View>
        <View style={styles.stat}>
          <Text variant="label" color="textSecondary" style={styles.statLabel}>
            Volume
          </Text>
          <Text variant="headingM">{`${Math.round(volume)} kg`}</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="label" color="textSecondary" style={styles.statLabel}>
            Sets
          </Text>
          <Text variant="headingM">{completedSets}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {state.exercises.map(exercise => (
          <WorkoutExerciseCard
            key={exercise.workoutExerciseId}
            exercise={exercise}
            onChangeNotes={notes => handleChangeNotes(exercise.workoutExerciseId, notes)}
            onChangeSet={(setId, field, value) =>
              handleChangeSet(exercise.workoutExerciseId, setId, field, value)
            }
            onToggleSet={setId => handleToggleSet(exercise.workoutExerciseId, setId)}
            onAddSet={() => handleAddSet(exercise.workoutExerciseId)}
            onRemoveSet={setId => handleRemoveSet(exercise.workoutExerciseId, setId)}
            onRemoveExercise={() => handleRemoveExercise(exercise.workoutExerciseId)}
            onPressRestTimer={() => setRestSheetFor(exercise.workoutExerciseId)}
          />
        ))}

        <Button
          label="Add Exercise"
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<PlusIcon color={colors.primary} />}
          onPress={handleAddExercise}
          accessibilityLabel="Add Exercise"
          accessibilityHint="Opens the exercise library"
          style={styles.addExercise}
        />

        <View style={styles.footerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => Alert.alert('Workout settings', 'Workout settings are coming soon.')}
            style={({ pressed }) => [styles.footerButton, pressed && styles.footerButtonPressed]}
          >
            <Text variant="button" color="textPrimary">
              Settings
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard Workout"
            onPress={confirmDiscard}
            style={({ pressed }) => [styles.footerButton, pressed && styles.footerButtonPressed]}
          >
            <Text variant="button" color="error">
              Discard Workout
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {rest.remaining !== null ? (
        <RestTimerBar
          remaining={rest.remaining}
          total={rest.total}
          onAdjust={rest.adjust}
          onSkip={rest.skip}
        />
      ) : null}

      <RestTimerSheet
        visible={restSheetExercise != null}
        exerciseName={restSheetExercise?.exerciseName}
        value={restSheetExercise?.restTimerSeconds ?? null}
        onDone={seconds => {
          if (restSheetExercise) {
            handleChangeRestTimer(restSheetExercise.workoutExerciseId, seconds);
          }
        }}
        onClose={() => setRestSheetFor(null)}
      />

      {busy ? (
        <View style={styles.overlay} pointerEvents="auto">
          <Loader />
        </View>
      ) : null}
    </Screen>
  );
});

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    marginBottom: spacing.xxs,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['5xl'],
  },
  addExercise: {
    marginTop: spacing.sm,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  footerButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  footerButtonPressed: {
    backgroundColor: colors.surface,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  overlay: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
