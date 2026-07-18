import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { NoteIcon } from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { secondsToDuration } from '@/utils/duration';

import type { WorkoutHistoryExercise } from '../types/history.types';

export interface WorkoutExerciseRowProps {
  exercise: WorkoutHistoryExercise;
}

const IMAGE_SIZE = 44;

/** One exercise in an expanded workout card: circular thumbnail, name, and a
 *  SET / KG / REPS table of completed sets (incomplete sets are ignored),
 *  mirroring the live-session layout. */
export const WorkoutExerciseRow = React.memo(function WorkoutExerciseRowBase({
  exercise,
}: WorkoutExerciseRowProps) {
  const completedSets = useMemo(
    () => exercise.sets.filter(set => set.completed),
    [exercise.sets],
  );
  const timerMode = exercise.trackingType === 'TIME';

  return (
    <View style={styles.row}>
      <Image
        source={{ uri: exercise.imageUrl }}
        style={styles.image}
        resizeMode="cover"
        accessible={false}
      />
      <View style={styles.body}>
        <Text variant="subtitle" numberOfLines={2} style={styles.name}>
          {exercise.exerciseName}
        </Text>
        {exercise.notes ? (
          <View style={styles.notesRow}>
            <NoteIcon color={colors.primary} size={14} />
            <Text variant="bodySmall" color="primary" style={styles.notes}>
              {exercise.notes}
            </Text>
          </View>
        ) : null}
        {completedSets.length > 0 ? (
          <View style={styles.table}>
            {timerMode ? (
              <>
                <View style={styles.tableRow}>
                  <Text variant="label" color="textSecondary" style={columns.set}>
                    SET
                  </Text>
                  <Text variant="label" color="textSecondary" style={columns.kg}>
                    TIME
                  </Text>
                  <View style={columns.reps} />
                </View>
                {completedSets.map((set, index) => (
                  <View key={set.setNumber} style={styles.tableRow}>
                    <Text variant="subtitle" style={columns.set}>
                      {index + 1}
                    </Text>
                    <Text variant="subtitle" style={columns.kg}>
                      {set.duration != null ? secondsToDuration(set.duration) : '-'}
                    </Text>
                    <View style={columns.reps} />
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={styles.tableRow}>
                  <Text variant="label" color="textSecondary" style={columns.set}>
                    SET
                  </Text>
                  <Text variant="label" color="textSecondary" style={columns.kg}>
                    KG
                  </Text>
                  <Text variant="label" color="textSecondary" style={columns.reps}>
                    REPS
                  </Text>
                </View>
                {completedSets.map((set, index) => (
                  <View key={set.setNumber} style={styles.tableRow}>
                    <Text variant="subtitle" style={columns.set}>
                      {index + 1}
                    </Text>
                    <Text variant="subtitle" style={columns.kg}>
                      {set.weight ?? '-'}
                    </Text>
                    <Text variant="subtitle" style={columns.reps}>
                      {set.reps ?? '-'}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        ) : (
          <Text variant="caption" color="textDisabled" style={styles.emptyNote}>
            No completed sets
          </Text>
        )}
      </View>
    </View>
  );
});

/**
 * Three equal left-aligned columns starting at the exercise name's left edge,
 * so SET, KG, and REPS sit at evenly spaced positions.
 */
const columns = StyleSheet.create({
  set: {
    flex: 1,
    textAlign: 'left',
  },
  kg: {
    flex: 1,
    textAlign: 'left',
  },
  reps: {
    flex: 1,
    textAlign: 'left',
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    backgroundColor: colors.surfaceElevated,
  },
  body: {
    flex: 1,
    paddingTop: spacing.xxs,
  },
  name: {
    textTransform: 'capitalize',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  notes: {
    flexShrink: 1,
  },
  table: {
    marginTop: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  emptyNote: {
    marginTop: spacing.xs,
  },
});
