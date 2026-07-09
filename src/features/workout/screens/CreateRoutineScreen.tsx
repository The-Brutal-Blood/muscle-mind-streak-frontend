import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PlusIcon } from '@/components/icons/ActionIcons';
import { DumbbellIcon } from '@/components/icons/TabIcons';
import { Button, Screen, Text } from '@/components/ui';
import type { Exercise } from '@/features/exercises/types/exercise.types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, spacing, typography } from '@/theme';

import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseMenuSheet } from '../components/ExerciseMenuSheet';
import { ReorderExercisesModal } from '../components/ReorderExercisesModal';
import { RestTimerSheet } from '../components/RestTimerSheet';
import type { RoutineExerciseDraft } from '../types/workout.types';

export interface RoutineDraft {
  name: string;
  exercises: RoutineExerciseDraft[];
}

/** Replacement handed back by the library when swapping one exercise for another. */
export interface ExerciseReplacement {
  targetId: string;
  exercise: Exercise;
}

export interface CreateRoutineScreenProps {
  /** Exercises returned by the Add Exercise flow; merged into the draft. */
  addedExercises?: Exercise[];
  /** A swap returned by the library's replace flow; applied to the target slot. */
  replacement?: ExerciseReplacement;
  /** Opens the exercise picker. Navigation is owned by the caller. */
  onAddExercise?: () => void;
  /** Opens the library to replace the given exercise. Navigation is owned by the caller. */
  onReplaceExercise?: (targetId: string) => void;
  /** Dismisses the screen without saving. Navigation is owned by the caller. */
  onCancel?: () => void;
  /** Fired with the draft when Save is pressed. Persistence is wired later. */
  onSave?: (draft: RoutineDraft) => void;
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
    sets: [{ id: setId, kg: '', reps: '' }],
  };
}

export const CreateRoutineScreen = React.memo(function CreateRoutineScreenBase({
  addedExercises,
  replacement,
  onAddExercise,
  onReplaceExercise,
  onCancel,
  onSave,
}: CreateRoutineScreenProps) {
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<RoutineExerciseDraft[]>([]);
  const [restSheetFor, setRestSheetFor] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [reorderVisible, setReorderVisible] = useState(false);

  // Monotonic set-id source so React keys stay stable across add/remove.
  const setSeq = useRef(0);
  const nextSetId = useCallback(() => `set-${setSeq.current++}`, []);

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

  // Add Set duplicates the last row's values (weight/reps) as a starting point.
  const handleAddSet = useCallback(
    (exerciseId: string) =>
      updateEntry(exerciseId, entry => {
        const previous = entry.sets[entry.sets.length - 1];
        return {
          ...entry,
          sets: [
            ...entry.sets,
            { id: nextSetId(), kg: previous?.kg ?? '', reps: previous?.reps ?? '' },
          ],
        };
      }),
    [updateEntry, nextSetId],
  );

  const handleChangeSet = useCallback(
    (exerciseId: string, setId: string, field: 'kg' | 'reps', value: string) =>
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

  const handleAddToSuperset = useCallback(() => {
    Alert.alert('Add To Superset', 'Superset support is coming soon.');
  }, []);

  const menuEntry = entries.find(entry => entry.exercise.id === menuFor) ?? null;

  const canSave = name.trim().length > 0;
  const isDirty = name.trim().length > 0 || entries.length > 0;

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

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    onSave?.({ name: name.trim(), exercises: entries });
  };

  const restSheetEntry = entries.find(entry => entry.exercise.id === restSheetFor) ?? null;

  // Content eases in under the modal slide.
  const reduceMotion = useReducedMotion();
  const contentOpacity = useRef(new Animated.Value(0)).current;

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
            Create Routine
          </Text>
          <Button
            label="Save"
            variant="primary"
            size="sm"
            disabled={!canSave}
            onPress={handleSave}
            accessibilityLabel="Save"
            accessibilityHint="Saves the routine"
          />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Routine title"
            placeholderTextColor={colors.placeholder}
            selectionColor={colors.primary}
            style={styles.titleInput}
            maxLength={60}
            returnKeyType="done"
            accessibilityLabel="Routine title"
            accessibilityHint="Names your new routine"
          />

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
                    onOpenRestTimer={() => setRestSheetFor(entry.exercise.id)}
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
});
