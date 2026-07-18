import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { DotsVerticalIcon, PlusIcon, TimerIcon } from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

import type { RoutineExerciseDraft } from '../types/workout.types';
import {
  normalizeDuration,
  sanitizeDuration,
  sanitizeReps,
  sanitizeWeight,
} from '../utils/inputSanitizers';
import { formatRestTimer, formatRestTimerCompact } from '../utils/restTimer';

export interface ExerciseCardProps {
  entry: RoutineExerciseDraft;
  onChangeNotes: (notes: string) => void;
  onOpenRestTimer: () => void;
  /** Turns the rest timer off (switch flipped to off). */
  onClearRestTimer: () => void;
  /** Switches this exercise between weight/reps and duration planning. */
  onToggleTimerMode: () => void;
  onAddSet: () => void;
  onChangeSet: (setId: string, field: 'kg' | 'reps' | 'duration', value: string) => void;
  onRemoveSet: (setId: string) => void;
  onOpenMenu: () => void;
  /** Opens the exercise's detail screen (info, history, instructions). */
  onPressExercise?: () => void;
}

const THUMBNAIL_SIZE = 40;
const MENU_HIT_SIZE = 32;

/**
 * A single exercise inside the routine editor: title, notes, rest timer, and
 * an editable table of sets with an add-set control.
 */
export const ExerciseCard = React.memo(function ExerciseCardBase({
  entry,
  onChangeNotes,
  onOpenRestTimer,
  onClearRestTimer,
  onToggleTimerMode,
  onAddSet,
  onChangeSet,
  onRemoveSet,
  onOpenMenu,
  onPressExercise,
}: ExerciseCardProps) {
  const { exercise, notes, restSeconds, sets } = entry;
  const timerMode = entry.trackingType === 'TIME';
  const restTimerOn = restSeconds != null && restSeconds > 0;

  const confirmRemoveSet = (setId: string, index: number) => {
    Alert.alert('Remove set', `Remove set ${index + 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemoveSet(setId) },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View details for ${exercise.name}`}
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
            {exercise.name}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${exercise.name}`}
          accessibilityHint="Opens exercise options"
          onPress={onOpenMenu}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
        >
          <DotsVerticalIcon color={colors.textSecondary} size={20} />
        </Pressable>
      </View>

      <TextInput
        value={notes}
        onChangeText={onChangeNotes}
        placeholder="Add routine notes here"
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        style={styles.notes}
        multiline
        accessibilityLabel={`Notes for ${exercise.name}`}
      />

      <View style={styles.modeRow}>
        <View style={styles.modeGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Rest timer: ${formatRestTimer(restSeconds)}`}
            accessibilityHint="Opens the rest timer picker"
            onPress={onOpenRestTimer}
            hitSlop={spacing.xs}
            style={({ pressed }) => [styles.restRow, pressed && styles.restRowPressed]}
          >
            <TimerIcon color={colors.primary} size={18} />
            <Text variant="subtitle" color="primary" numberOfLines={1} style={styles.restLabel}>
              {restTimerOn ? formatRestTimerCompact(restSeconds) : 'Rest Timer'}
            </Text>
          </Pressable>
          <Switch
            value={restTimerOn}
            onValueChange={value => (value ? onOpenRestTimer() : onClearRestTimer())}
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
            accessibilityHint="Plans time instead of weight and reps for this exercise"
            style={styles.switch}
          />
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text variant="label" color="textSecondary" style={styles.colSet}>
          SET
        </Text>
        {timerMode ? (
          <Text variant="label" color="textSecondary" style={styles.colValueLabel}>
            TIME
          </Text>
        ) : (
          <>
            <Text variant="label" color="textSecondary" style={styles.colValueLabel}>
              KG
            </Text>
            <Text variant="label" color="textSecondary" style={styles.colValueLabel}>
              REPS
            </Text>
          </>
        )}
      </View>

      {sets.map((set, index) => (
        <Pressable
          key={set.id}
          onLongPress={() => confirmRemoveSet(set.id, index)}
          delayLongPress={350}
          accessibilityRole="button"
          accessibilityLabel={`Set ${index + 1}`}
          accessibilityHint="Long press to remove this set"
          style={({ pressed }) => [styles.setRow, pressed && styles.setRowPressed]}
        >
          <Text variant="subtitle" style={styles.colSet}>
            {index + 1}
          </Text>
          {timerMode ? (
            <View style={styles.colValue}>
              <TextInput
                value={set.duration ?? ''}
                onChangeText={text => onChangeSet(set.id, 'duration', sanitizeDuration(text))}
                onEndEditing={() =>
                  onChangeSet(set.id, 'duration', normalizeDuration(set.duration ?? ''))
                }
                placeholder="00:00"
                placeholderTextColor={colors.placeholder}
                selectionColor={colors.primary}
                keyboardType="numbers-and-punctuation"
                maxLength={6}
                style={styles.cellInput}
                accessibilityLabel={`Set ${index + 1} duration in minutes and seconds`}
              />
            </View>
          ) : (
            <>
              <View style={styles.colValue}>
                <TextInput
                  value={set.kg}
                  onChangeText={text => onChangeSet(set.id, 'kg', sanitizeWeight(text))}
                  placeholder="-"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.primary}
                  keyboardType="numeric"
                  maxLength={6}
                  style={styles.cellInput}
                  accessibilityLabel={`Set ${index + 1} weight in kilograms`}
                />
              </View>
              <View style={styles.colValue}>
                <TextInput
                  value={set.reps}
                  onChangeText={text => onChangeSet(set.id, 'reps', sanitizeReps(text))}
                  placeholder="-"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.primary}
                  keyboardType="numeric"
                  maxLength={4}
                  style={styles.cellInput}
                  accessibilityLabel={`Set ${index + 1} repetitions`}
                />
              </View>
            </>
          )}
        </Pressable>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add set"
        accessibilityHint={`Adds a set to ${exercise.name}`}
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
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  colSet: {
    width: 44,
    textAlign: 'left',
  },
  colValue: {
    flex: 1,
    alignItems: 'center',
  },
  colValueLabel: {
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  setRowPressed: {
    backgroundColor: colors.surface,
  },
  cellInput: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: 'center',
    minWidth: 64,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
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
