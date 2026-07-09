import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { CheckIcon, TrendingUpCircleIcon } from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import type { Exercise } from '../types/exercise.types';

export interface ExerciseListItemProps {
  exercise: Exercise;
  selected: boolean;
  onToggle: (exercise: Exercise) => void;
  /** Opens the exercise's detail screen. Omit to hide the info affordance. */
  onInfo?: (exercise: Exercise) => void;
}

const THUMBNAIL_SIZE = 56;
const CHECK_BADGE_SIZE = 28;
const INFO_BUTTON_SIZE = 32;

/** One library row: thumbnail, name, primary muscle, selection state. */
export const ExerciseListItem = React.memo(function ExerciseListItemBase({
  exercise,
  selected,
  onToggle,
  onInfo,
}: ExerciseListItemProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${exercise.name}, ${exercise.category}`}
      accessibilityHint={selected ? 'Removes from selection' : 'Adds to selection'}
      onPress={() => onToggle(exercise)}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
      <Image
        source={{ uri: exercise.imageUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
        accessible={false}
      />
      <View style={styles.info}>
        <Text variant="subtitle" numberOfLines={1} style={styles.name}>
          {exercise.name}
        </Text>
        <Text variant="bodySmall" color="textSecondary" numberOfLines={1} style={styles.muscle}>
          {exercise.category}
        </Text>
      </View>
      {selected ? (
        <View style={styles.checkBadge}>
          <CheckIcon color={colors.textOnPrimary} size={18} />
        </View>
      ) : null}
      {onInfo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View details for ${exercise.name}`}
          accessibilityHint="Opens exercise information"
          onPress={() => onInfo(exercise)}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
        >
          <TrendingUpCircleIcon color={colors.textSecondary} size={24} />
        </Pressable>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    backgroundColor: colors.surfaceElevated,
  },
  info: {
    flex: 1,
  },
  name: {
    textTransform: 'capitalize',
  },
  muscle: {
    textTransform: 'capitalize',
    marginTop: spacing.xxs,
  },
  checkBadge: {
    width: CHECK_BADGE_SIZE,
    height: CHECK_BADGE_SIZE,
    borderRadius: CHECK_BADGE_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButton: {
    width: INFO_BUTTON_SIZE,
    height: INFO_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: INFO_BUTTON_SIZE / 2,
  },
  infoButtonPressed: {
    backgroundColor: colors.surfaceElevated,
  },
});
