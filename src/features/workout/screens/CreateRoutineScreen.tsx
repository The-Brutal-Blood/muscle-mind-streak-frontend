import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PlusIcon } from '@/components/icons/ActionIcons';
import { DumbbellIcon } from '@/components/icons/TabIcons';
import { Button, Loader, Screen, Text } from '@/components/ui';
import type { Exercise } from '@/features/exercises/types/exercise.types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius, spacing, typography } from '@/theme';
import { secondsToDuration } from '@/utils/duration';

import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseMenuSheet } from '../components/ExerciseMenuSheet';
import { ReorderExercisesModal } from '../components/ReorderExercisesModal';
import { RestTimerSheet } from '../components/RestTimerSheet';
import { WeeklyScheduler } from '../components/WeeklyScheduler';
import { useCreateRoutine, useRoutineDetail, useUpdateRoutine } from '../hooks/useRoutines';
import type { RoutineDetail, RoutineExerciseDraft, Weekday } from '../types/workout.types';
import { buildCreateRoutinePayload } from '../utils/routinePayload';

export type RoutineEditorMode = 'create' | 'edit' | 'duplicate';

/** Replacement handed back by the library when swapping one exercise for another. */
export interface ExerciseReplacement {
  targetId: string;
  exercise: Exercise;
}

export interface CreateRoutineScreenProps {
  /** Editor mode. 'edit'/'duplicate' seed the form from `sourceRoutineId`. */
  mode?: RoutineEditorMode;
  /** Routine to load for edit (also the PUT target) or duplicate. */
  sourceRoutineId?: string;
  /** Exercises returned by the Add Exercise flow; merged into the draft. */
  addedExercises?: Exercise[];
  /** A swap returned by the library's replace flow; applied to the target slot. */
  replacement?: ExerciseReplacement;
  /** Opens the exercise picker. Navigation is owned by the caller. */
  onAddExercise?: () => void;
  /** Opens the library to replace the given exercise. Navigation is owned by the caller. */
  onReplaceExercise?: (targetId: string) => void;
  /** Opens an exercise's detail screen. Navigation is owned by the caller. */
  onOpenExerciseDetail?: (exerciseId: string) => void;
  /** Dismisses the screen without saving. Navigation is owned by the caller. */
  onCancel?: () => void;
  /** Fired after the routine is persisted. Navigation is owned by the caller. */
  onSaved?: () => void;
}

const EMPTY_STATE_ICON_SIZE = 48;
/** Rough duration of the options sheet's slide-out, before opening the next screen. */
const MENU_DISMISS_MS = 300;

/** Builds a fresh draft entry for a newly added exercise: one empty set, no rest. */
function createEntry(exercise: Exercise, setId: string): RoutineExerciseDraft {
  return {
    exercise,
    notes: '',
    restSeconds: null,
    trackingType: exercise.trackingType ?? 'WEIGHT_REPS',
    sets: [{ id: setId, kg: '', reps: '' }],
  };
}

/** Maps a fetched routine onto editor drafts, preserving order/sets/notes/rest. */
function detailToEntries(
  detail: RoutineDetail,
  nextSetId: () => string,
): RoutineExerciseDraft[] {
  return [...detail.exercises]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(exercise => {
      const sets = (exercise.sets ?? []).map(set => ({
        id: nextSetId(),
        kg: set.weight != null ? String(set.weight) : '',
        reps: set.reps != null ? String(set.reps) : '',
        duration: set.duration != null ? secondsToDuration(set.duration) : '',
      }));
      return {
        exercise: {
          id: exercise.exerciseId,
          name: exercise.exerciseName,
          imageUrl: exercise.imageUrl,
        },
        notes: exercise.notes ?? '',
        restSeconds:
          exercise.restTimerSeconds != null && exercise.restTimerSeconds > 0
            ? exercise.restTimerSeconds
            : null,
        // Backend is the source of truth for how the exercise is tracked.
        trackingType: exercise.trackingType ?? 'WEIGHT_REPS',
        sets: sets.length > 0 ? sets : [{ id: nextSetId(), kg: '', reps: '' }],
      };
    });
}

export const CreateRoutineScreen = React.memo(function CreateRoutineScreenBase({
  mode = 'create',
  sourceRoutineId,
  addedExercises,
  replacement,
  onAddExercise,
  onReplaceExercise,
  onOpenExerciseDetail,
  onCancel,
  onSaved,
}: CreateRoutineScreenProps) {
  // Capture mode/source once: the Add Exercise round trip mutates route params,
  // and we must not let an edit silently turn back into a create.
  const [routineMode] = useState(mode);
  const [editRoutineId] = useState(sourceRoutineId);

  const [name, setName] = useState('');
  const [entries, setEntries] = useState<RoutineExerciseDraft[]>([]);
  const [scheduledDays, setScheduledDays] = useState<Weekday[]>([]);
  const [restSheetFor, setRestSheetFor] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [reorderVisible, setReorderVisible] = useState(false);
  // Set when the user taps Save without a title; drives the inline hint + shake.
  const [titleError, setTitleError] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  // Horizontal offset for the title "shake" when Save is tapped with no title.
  const titleShake = useRef(new Animated.Value(0)).current;

  const createRoutineMutation = useCreateRoutine();
  const updateRoutineMutation = useUpdateRoutine();

  const needsDetail = routineMode !== 'create' && !!editRoutineId;
  const detailQuery = useRoutineDetail(editRoutineId ?? '', needsDetail);

  // Monotonic set-id source so React keys stay stable across add/remove.
  const setSeq = useRef(0);
  const nextSetId = useCallback(() => `set-${setSeq.current++}`, []);

  // Seed the form once the source routine loads (edit/duplicate).
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !needsDetail || !detailQuery.data) {
      return;
    }
    seededRef.current = true;
    const detail = detailQuery.data;
    setName(routineMode === 'duplicate' ? `${detail.name} (copy)` : detail.name);
    setEntries(detailToEntries(detail, nextSetId));
    setScheduledDays(detail.scheduledDays ?? []);
  }, [needsDetail, detailQuery.data, routineMode, nextSetId]);

  // Each Add Exercise round trip delivers a fresh batch; merge without
  // duplicating anything already in the draft.
  useEffect(() => {
    if (!addedExercises || addedExercises.length === 0) {
      return;
    }
    setEntries(current => {
      const known = new Set(current.map(entry => entry.exercise.id));
      const fresh = addedExercises.filter(exercise => !known.has(exercise.id));
      if (fresh.length === 0) {
        return current;
      }
      return [...current, ...fresh.map(exercise => createEntry(exercise, nextSetId()))];
    });
  }, [addedExercises, nextSetId]);

  // A replace round trip swaps the exercise in its slot, keeping sets/notes/rest.
  // Idempotent: re-running with the same replacement is a no-op.
  useEffect(() => {
    if (!replacement) {
      return;
    }
    setEntries(current => {
      const targetIndex = current.findIndex(
        entry => entry.exercise.id === replacement.targetId,
      );
      if (targetIndex === -1) {
        return current;
      }
      const target = current[targetIndex];
      if (target.exercise.id === replacement.exercise.id) {
        return current;
      }
      // Guard against colliding with an exercise already in the draft.
      if (current.some(entry => entry.exercise.id === replacement.exercise.id)) {
        return current;
      }
      const next = [...current];
      next[targetIndex] = { ...target, exercise: replacement.exercise };
      return next;
    });
  }, [replacement]);

  // Clear the "enter a title" hint as soon as the user provides one.
  const handleChangeName = useCallback(
    (value: string) => {
      setName(value);
      if (value.trim().length > 0) {
        setTitleError(false);
      }
    },
    [],
  );

  const updateEntry = useCallback(
    (exerciseId: string, updater: (entry: RoutineExerciseDraft) => RoutineExerciseDraft) => {
      setEntries(current =>
        current.map(entry => (entry.exercise.id === exerciseId ? updater(entry) : entry)),
      );
    },
    [],
  );

  const handleChangeNotes = useCallback(
    (exerciseId: string, notes: string) => updateEntry(exerciseId, entry => ({ ...entry, notes })),
    [updateEntry],
  );

  const handleSetRest = useCallback(
    (exerciseId: string, restSeconds: number | null) =>
      updateEntry(exerciseId, entry => ({ ...entry, restSeconds })),
    [updateEntry],
  );

  const handleToggleTimerMode = useCallback(
    (exerciseId: string) =>
      updateEntry(exerciseId, entry => ({
        ...entry,
        trackingType: entry.trackingType === 'TIME' ? 'WEIGHT_REPS' : 'TIME',
      })),
    [updateEntry],
  );

  // Add Set duplicates the last row's values (weight/reps/duration) as a starting point.
  const handleAddSet = useCallback(
    (exerciseId: string) =>
      updateEntry(exerciseId, entry => {
        const previous = entry.sets[entry.sets.length - 1];
        return {
          ...entry,
          sets: [
            ...entry.sets,
            {
              id: nextSetId(),
              kg: previous?.kg ?? '',
              reps: previous?.reps ?? '',
              duration: previous?.duration,
            },
          ],
        };
      }),
    [updateEntry, nextSetId],
  );

  const handleChangeSet = useCallback(
    (exerciseId: string, setId: string, field: 'kg' | 'reps' | 'duration', value: string) =>
      updateEntry(exerciseId, entry => ({
        ...entry,
        sets: entry.sets.map(set => (set.id === setId ? { ...set, [field]: value } : set)),
      })),
    [updateEntry],
  );

  const handleRemoveSet = useCallback(
    (exerciseId: string, setId: string) =>
      updateEntry(exerciseId, entry => ({
        ...entry,
        sets: entry.sets.filter(set => set.id !== setId),
      })),
    [updateEntry],
  );

  const removeExercise = useCallback((exerciseId: string) => {
    setEntries(current => current.filter(entry => entry.exercise.id !== exerciseId));
  }, []);

  // Reconcile the reorder editor's result: apply the new order, drop removals.
  const applyReorder = useCallback((orderedIds: string[]) => {
    setEntries(current => {
      const byId = new Map(current.map(entry => [entry.exercise.id, entry]));
      return orderedIds
        .map(id => byId.get(id))
        .filter((entry): entry is RoutineExerciseDraft => entry != null);
    });
  }, []);

  const toggleDay = useCallback((day: Weekday) => {
    setScheduledDays(current =>
      current.includes(day) ? current.filter(other => other !== day) : [...current, day],
    );
  }, []);

  const handleAddToSuperset = useCallback(() => {
    Alert.alert('Add To Superset', 'Superset support is coming soon.');
  }, []);

  const menuEntry = entries.find(entry => entry.exercise.id === menuFor) ?? null;

  const canSave = name.trim().length > 0;
  const isDirty = name.trim().length > 0 || entries.length > 0 || scheduledDays.length > 0;

  const handleCancel = () => {
    if (!isDirty) {
      onCancel?.();
      return;
    }
    Alert.alert('Discard routine?', 'Your changes will not be saved.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => onCancel?.() },
    ]);
  };

  const isSaving = createRoutineMutation.isPending || updateRoutineMutation.isPending;

  const handleSave = () => {
    if (isSaving) {
      return;
    }
    // Missing title: guide the user to the field with an inline hint + shake
    // instead of silently doing nothing.
    if (!canSave) {
      setTitleError(true);
      titleInputRef.current?.focus();
      shakeTitle();
      return;
    }
    const payload = buildCreateRoutinePayload(name, entries, scheduledDays);
    if (routineMode === 'edit' && editRoutineId) {
      updateRoutineMutation.mutate(
        { id: editRoutineId, payload },
        {
          onSuccess: () => onSaved?.(),
          onError: error => Alert.alert('Could not update routine', error.message),
        },
      );
      return;
    }
    createRoutineMutation.mutate(payload, {
      onSuccess: () => onSaved?.(),
      onError: error => Alert.alert('Could not save routine', error.message),
    });
  };

  const restSheetEntry = entries.find(entry => entry.exercise.id === restSheetFor) ?? null;

  // Content eases in under the modal slide.
  const reduceMotion = useReducedMotion();
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Quick side-to-side nudge on the title field to flag the missing title.
  const shakeTitle = useCallback(() => {
    if (reduceMotion) {
      return;
    }
    titleShake.setValue(0);
    Animated.sequence(
      [1, -1, 1, -1, 0].map(toValue =>
        Animated.timing(titleShake, {
          toValue,
          duration: 55,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [reduceMotion, titleShake]);

  const titleTranslateX = titleShake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-9, 0, 9],
  });

  useEffect(() => {
    if (reduceMotion === null) {
      return undefined;
    }
    if (reduceMotion) {
      contentOpacity.setValue(1);
      return undefined;
    }
    const entrance = Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    entrance.start();
    return () => entrance.stop();
  }, [reduceMotion, contentOpacity]);

  return (
    <Screen padded={false}>
      <Animated.View style={[styles.root, { opacity: contentOpacity }]}>
        <View style={styles.header}>
          <Button
            label="Cancel"
            variant="ghost"
            size="sm"
            onPress={handleCancel}
            accessibilityLabel="Cancel"
            accessibilityHint="Closes without saving the routine"
          />
          <Text variant="title" accessibilityRole="header">
            {routineMode === 'edit' ? 'Edit Routine' : 'Create Routine'}
          </Text>
          <Button
            label="Save"
            variant="primary"
            size="sm"
            loading={isSaving}
            onPress={handleSave}
            accessibilityLabel="Save"
            accessibilityHint="Saves the routine"
          />
        </View>

        {needsDetail && detailQuery.isPending ? (
          <Loader fullscreen />
        ) : needsDetail && detailQuery.isError ? (
          <View style={styles.stateContainer}>
            <View
              style={styles.errorBox}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <Text variant="bodySmall" color="error" align="center">
                {detailQuery.error.message}
              </Text>
            </View>
            <Button
              label="Try Again"
              variant="outline"
              size="md"
              onPress={() => detailQuery.refetch()}
              accessibilityLabel="Try Again"
              accessibilityHint="Reloads the routine"
            />
          </View>
        ) : (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ transform: [{ translateX: titleTranslateX }] }}>
              <TextInput
                ref={titleInputRef}
                value={name}
                onChangeText={handleChangeName}
                placeholder="Routine title"
                placeholderTextColor={colors.placeholder}
                selectionColor={colors.primary}
                style={[styles.titleInput, titleError && styles.titleInputError]}
                maxLength={60}
                returnKeyType="done"
                accessibilityLabel="Routine title"
                accessibilityHint="Names your new routine"
              />
              {titleError ? (
                <Text
                  variant="bodySmall"
                  color="error"
                  style={styles.titleError}
                  accessibilityLiveRegion="polite"
                >
                  Please enter the title to save routine
                </Text>
              ) : null}
            </Animated.View>

          {entries.length > 0 ? (
            <WeeklyScheduler value={scheduledDays} onToggle={toggleDay} />
          ) : null}

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <DumbbellIcon color={colors.textSecondary} size={EMPTY_STATE_ICON_SIZE} />
              <Text variant="body" color="textSecondary" align="center" style={styles.emptyText}>
                Get started by adding an exercise to your routine.
              </Text>
              <Button
                label="Add exercise"
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<PlusIcon color={colors.textOnPrimary} />}
                onPress={onAddExercise}
                accessibilityLabel="Add exercise"
                accessibilityHint="Opens the exercise picker"
                style={styles.addButton}
              />
            </View>
          ) : (
            <View style={styles.exerciseSection}>
              <Text variant="label" color="textSecondary" style={styles.exerciseCount}>
                {`Exercises (${entries.length})`}
              </Text>
              <View style={styles.exerciseList}>
                {entries.map(entry => (
                  <ExerciseCard
                    key={entry.exercise.id}
                    entry={entry}
                    onChangeNotes={notes => handleChangeNotes(entry.exercise.id, notes)}
                    onPressExercise={() => onOpenExerciseDetail?.(entry.exercise.id)}
                    onOpenRestTimer={() => setRestSheetFor(entry.exercise.id)}
                    onClearRestTimer={() => handleSetRest(entry.exercise.id, null)}
                    onToggleTimerMode={() => handleToggleTimerMode(entry.exercise.id)}
                    onAddSet={() => handleAddSet(entry.exercise.id)}
                    onChangeSet={(setId, field, value) =>
                      handleChangeSet(entry.exercise.id, setId, field, value)
                    }
                    onRemoveSet={setId => handleRemoveSet(entry.exercise.id, setId)}
                    onOpenMenu={() => setMenuFor(entry.exercise.id)}
                  />
                ))}
              </View>
              <Button
                label="Add exercise"
                variant="secondary"
                size="lg"
                fullWidth
                leftIcon={<PlusIcon color={colors.primary} />}
                onPress={onAddExercise}
                accessibilityLabel="Add exercise"
                accessibilityHint="Opens the exercise picker"
                style={styles.addMoreButton}
              />
            </View>
          )}
          </ScrollView>
        )}
      </Animated.View>

      <RestTimerSheet
        visible={restSheetEntry != null}
        exerciseName={restSheetEntry?.exercise.name}
        value={restSheetEntry?.restSeconds ?? null}
        onDone={seconds => {
          if (restSheetEntry) {
            handleSetRest(restSheetEntry.exercise.id, seconds);
          }
        }}
        onClose={() => setRestSheetFor(null)}
      />

      <ExerciseMenuSheet
        visible={menuEntry != null}
        exerciseName={menuEntry?.exercise.name}
        // Reorder/replace open another presentation; wait for this sheet to
        // finish dismissing first so iOS doesn't drop the second modal.
        onReorder={() => setTimeout(() => setReorderVisible(true), MENU_DISMISS_MS)}
        onReplace={() => {
          const targetId = menuEntry?.exercise.id;
          if (targetId) {
            setTimeout(() => onReplaceExercise?.(targetId), MENU_DISMISS_MS);
          }
        }}
        onAddToSuperset={handleAddToSuperset}
        onRemove={() => {
          if (menuEntry) {
            removeExercise(menuEntry.exercise.id);
          }
        }}
        onClose={() => setMenuFor(null)}
      />

      <ReorderExercisesModal
        visible={reorderVisible}
        items={entries.map(entry => ({
          id: entry.exercise.id,
          name: entry.exercise.name,
          imageUrl: entry.exercise.imageUrl,
        }))}
        onDone={applyReorder}
        onClose={() => setReorderVisible(false)}
      />
    </Screen>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  titleInput: {
    ...typography.headingL,
    color: colors.textPrimary,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  titleInputError: {
    borderBottomColor: colors.error,
  },
  titleError: {
    marginTop: spacing.sm,
  },
  bodyContent: {
    paddingBottom: spacing['3xl'],
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing['7xl'],
  },
  emptyText: {
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  addButton: {
    alignSelf: 'stretch',
  },
  exerciseSection: {
    marginTop: spacing['2xl'],
  },
  exerciseCount: {
    marginBottom: spacing.md,
  },
  exerciseList: {
    gap: spacing.lg,
  },
  addMoreButton: {
    marginTop: spacing.xl,
  },
  stateContainer: {
    padding: spacing['3xl'],
    gap: spacing.md,
    alignItems: 'center',
  },
  errorBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
