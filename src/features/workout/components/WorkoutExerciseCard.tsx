import React from 'react';
import { Image, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { CheckIcon, DotsVerticalIcon, PlusIcon, TimerIcon } from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

import { columns, WorkoutSetRow } from './WorkoutSetRow';
import type { WorkoutExerciseState } from '../types/workout.types';
import { formatRestTimer, formatRestTimerCompact } from '../utils/restTimer';

export interface WorkoutExerciseCardProps {
  exercise: WorkoutExerciseState;
  onChangeNotes: (notes: string) => void;
  onChangeSet: (setId: string, field: 'weight' | 'reps' | 'duration', value: string) => void;
  onToggleSet: (setId: string) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  /** Opens the exercise options sheet (reorder/remove). */
  onOpenMenu: () => void;
  /** Opens the exercise's detail screen (info, history, instructions). */
  onPressExercise?: () => void;
  /** Opens the rest-timer picker for this exercise. */
  onPressRestTimer: () => void;
  /** Turns the rest timer off (switch flipped to off). */
  onClearRestTimer: () => void;
  /** Switches this exercise between weight/reps and duration logging. */
  onToggleTimerMode: () => void;
}

const THUMBNAIL_SIZE = 40;
const MENU_HIT_SIZE = 32;

/** One exercise in the live session: header, notes, rest, and the sets table. */
export const WorkoutExerciseCard = React.memo(function WorkoutExerciseCardBase({
  exercise,
  onChangeNotes,
  onChangeSet,
  onToggleSet,
  onAddSet,
  onRemoveSet,
  onOpenMenu,
  onPressExercise,
  onPressRestTimer,
  onClearRestTimer,
  onToggleTimerMode,
}: WorkoutExerciseCardProps) {
  const timerMode = exercise.trackingType === 'TIME';
  const restTimerOn = exercise.restTimerSeconds != null && exercise.restTimerSeconds > 0;


  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View details for ${exercise.exerciseName}`}
          accessibilityHint="Opens the exercise's details"
          disabled={!onPressExercise}
          onPress={onPressExercise}
          style={({ pressed }) => [styles.identity, pressed && styles.identityPressed]}
        >
          <Image
            source={{ uri: exercise.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
            accessible={false}
          />
          <Text variant="title" color="primary" numberOfLines={2} style={styles.title}>
            {exercise.exerciseName}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${exercise.exerciseName}`}
          accessibilityHint="Opens exercise options"
          onPress={onOpenMenu}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
        >
          <DotsVerticalIcon color={colors.textSecondary} size={20} />
        </Pressable>
      </View>

      <TextInput
        value={exercise.notes}
        onChangeText={onChangeNotes}
        placeholder="Add notes here..."
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        style={styles.notes}
        multiline
        accessibilityLabel={`Notes for ${exercise.exerciseName}`}
      />

      <View style={styles.modeRow}>
        <View style={styles.modeGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Rest timer: ${formatRestTimer(exercise.restTimerSeconds)}`}
            accessibilityHint="Opens the rest timer picker"
            onPress={onPressRestTimer}
            hitSlop={spacing.xs}
            style={({ pressed }) => [styles.restRow, pressed && styles.restRowPressed]}
          >
            <TimerIcon color={colors.primary} size={18} />
            <Text variant="subtitle" color="primary" numberOfLines={1} style={styles.restLabel}>
              {restTimerOn ? formatRestTimerCompact(exercise.restTimerSeconds) : 'Rest Timer'}
            </Text>
          </Pressable>
          <Switch
            value={restTimerOn}
            onValueChange={value => (value ? onPressRestTimer() : onClearRestTimer())}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.textPrimary}
            ios_backgroundColor={colors.border}
            accessibilityLabel="Rest timer"
            style={styles.switch}
          />
        </View>
        <View style={styles.modeGroup}>
          <Text variant="subtitle" color={timerMode ? 'primary' : 'textSecondary'}>
            Timer Mode
          </Text>
          <Switch
            value={timerMode}
            onValueChange={onToggleTimerMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.textPrimary}
            ios_backgroundColor={colors.border}
            accessibilityLabel="Timer Mode"
            accessibilityHint="Logs time instead of weight and reps for this exercise"
            style={styles.switch}
          />
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text variant="label" color="textSecondary" style={columns.set}>
          SET
        </Text>
        <Text variant="label" color="textSecondary" style={columns.previous}>
          PREVIOUS
        </Text>
        {timerMode ? (
          <Text variant="label" color="textSecondary" style={columns.timeHeader}>
            TIME
          </Text>
        ) : (
          <>
            <Text variant="label" color="textSecondary" style={columns.valueHeader}>
              KG
            </Text>
            <Text variant="label" color="textSecondary" style={columns.valueHeader}>
              REPS
            </Text>
          </>
        )}
        <View style={columns.check}>
          <CheckIcon color={colors.textSecondary} size={14} />
        </View>
      </View>

      {exercise.sets.map((set, index) => (
        <React.Fragment key={set.workoutSetId}>
          {index > 0 ? <View style={styles.setDivider} /> : null}
          <WorkoutSetRow
            index={index}
            set={set}
            previous={exercise.previousSets[index]}
            timerMode={timerMode}
            onChangeWeight={value => onChangeSet(set.workoutSetId, 'weight', value)}
            onChangeReps={value => onChangeSet(set.workoutSetId, 'reps', value)}
            onChangeDuration={value => onChangeSet(set.workoutSetId, 'duration', value)}
            onToggleComplete={() => onToggleSet(set.workoutSetId)}
            onRemove={() => onRemoveSet(set.workoutSetId)}
          />
        </React.Fragment>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add set"
        accessibilityHint={`Adds a set to ${exercise.exerciseName}`}
        onPress={onAddSet}
        style={({ pressed }) => [styles.addSet, pressed && styles.addSetPressed]}
      >
        <PlusIcon color={colors.textPrimary} size={18} />
        <Text variant="button" color="textPrimary">
          Add Set
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identityPressed: {
    opacity: 0.6,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    backgroundColor: colors.surfaceElevated,
  },
  title: {
    flex: 1,
    textTransform: 'capitalize',
  },
  menuButton: {
    width: MENU_HIT_SIZE,
    height: MENU_HIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MENU_HIT_SIZE / 2,
  },
  menuButtonPressed: {
    backgroundColor: colors.surface,
  },
  notes: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  // Native switches are oversized next to subtitle text; scale them down.
  // Scaling shrinks only the visuals, not the layout box — the negative
  // margins reclaim that dead width so the labels keep their space.
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginHorizontal: -5,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  // Shrinks with ellipsis instead of running under the adjacent switch.
  restLabel: {
    flexShrink: 1,
  },
  restRowPressed: {
    opacity: 0.6,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  setDivider: {
    height: 1.5,
    backgroundColor: colors.divider,
  },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  addSetPressed: {
    backgroundColor: colors.surface,
  },
});
