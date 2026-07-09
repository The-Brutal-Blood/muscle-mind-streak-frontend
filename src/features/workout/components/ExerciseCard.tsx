import React from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  ChevronDownIcon,
  DotsVerticalIcon,
  PlusIcon,
  TimerIcon,
} from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

import type { RoutineExerciseDraft } from '../types/workout.types';
import { formatRestTimer } from '../utils/restTimer';

export interface ExerciseCardProps {
  entry: RoutineExerciseDraft;
  onChangeNotes: (notes: string) => void;
  onOpenRestTimer: () => void;
  onAddSet: () => void;
  onChangeSet: (setId: string, field: 'kg' | 'reps', value: string) => void;
  onOpenMenu: () => void;
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
  onAddSet,
  onChangeSet,
  onOpenMenu,
}: ExerciseCardProps) {
  const { exercise, notes, restSeconds, sets } = entry;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{ uri: exercise.imageUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
          accessible={false}
        />
        <Text variant="title" color="primary" numberOfLines={2} style={styles.title}>
          {exercise.name}
        </Text>
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Rest timer: ${formatRestTimer(restSeconds)}`}
        accessibilityHint="Opens the rest timer picker"
        onPress={onOpenRestTimer}
        hitSlop={spacing.xs}
        style={({ pressed }) => [styles.restRow, pressed && styles.restRowPressed]}
      >
        <TimerIcon color={colors.primary} size={18} />
        <Text variant="subtitle" color="primary">
          {`Rest Timer: ${formatRestTimer(restSeconds)}`}
        </Text>
      </Pressable>

      <View style={styles.tableHeader}>
        <Text variant="label" color="textSecondary" style={styles.colSet}>
          SET
        </Text>
        <Text variant="label" color="textSecondary" style={styles.colValueLabel}>
          KG
        </Text>
        <View style={styles.colValueRow}>
          <Text variant="label" color="textSecondary">
            REPS
          </Text>
          <ChevronDownIcon color={colors.textSecondary} size={14} />
        </View>
      </View>

      {sets.map((set, index) => (
        <View key={set.id} style={styles.setRow}>
          <Text variant="subtitle" style={styles.colSet}>
            {index + 1}
          </Text>
          <View style={styles.colValue}>
            <TextInput
              value={set.kg}
              onChangeText={text => onChangeSet(set.id, 'kg', text)}
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
              onChangeText={text => onChangeSet(set.id, 'reps', text)}
              placeholder="-"
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.primary}
              keyboardType="numeric"
              maxLength={4}
              style={styles.cellInput}
              accessibilityLabel={`Set ${index + 1} repetitions`}
            />
          </View>
        </View>
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
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
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
  colValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
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
