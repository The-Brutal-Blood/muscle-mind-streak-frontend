import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Divider, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { ExerciseSetRow } from './ExerciseSetRow';
import type { ExerciseHistoryWorkout } from '../types/exerciseHistory.types';
import { formatDuration, formatHistoryDate, formatVolume } from '../utils/exerciseHistoryFormat';

export interface ExerciseWorkoutHistoryCardProps {
  workout: ExerciseHistoryWorkout;
  /** True when the exercise is TIME-tracked (backend `trackingType`). */
  timerMode?: boolean;
}

/**
 * One past workout that included this exercise: routine, date, duration and
 * volume up top, then each recorded set — or a note when no set detail exists.
 */
export const ExerciseWorkoutHistoryCard = React.memo(function ExerciseWorkoutHistoryCardBase({
  workout,
  timerMode = false,
}: ExerciseWorkoutHistoryCardProps) {
  const meta = [formatDuration(workout.durationMinutes), formatVolume(workout.volume)].join(
    '  •  ',
  );

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="title" numberOfLines={1} style={styles.routine}>
          {workout.routineName}
        </Text>
        <Text variant="caption" color="textSecondary">
          {formatHistoryDate(workout.performedAt)}
        </Text>
      </View>

      <Text variant="bodySmall" color="textSecondary" style={styles.meta}>
        {meta}
      </Text>

      <Divider style={styles.divider} />

      {workout.sets.length > 0 ? (
        <View style={styles.sets}>
          {workout.sets.map(set => (
            <ExerciseSetRow
              key={set.setNumber}
              setNumber={set.setNumber}
              weight={set.weight}
              reps={set.reps}
              duration={set.duration}
              timerMode={timerMode}
            />
          ))}
        </View>
      ) : (
        <Text variant="bodySmall" color="textDisabled">
          No detailed set data available.
        </Text>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  routine: {
    flexShrink: 1,
    textTransform: 'capitalize',
  },
  meta: {
    marginTop: spacing.xs,
  },
  divider: {
    marginVertical: spacing.md,
  },
  sets: {
    gap: spacing.xs,
  },
});
