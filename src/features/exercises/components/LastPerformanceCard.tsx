import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Divider, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { ExerciseSetRow } from './ExerciseSetRow';
import type { ExerciseLastPerformance } from '../types/exerciseHistory.types';
import { formatHistoryDate, formatVolume } from '../utils/exerciseHistoryFormat';

export interface LastPerformanceCardProps {
  performance: ExerciseLastPerformance;
  /** True when the exercise is TIME-tracked (backend `trackingType`). */
  timerMode?: boolean;
}

/**
 * The most recent performance: routine, date, and total volume up top, then
 * every recorded set below (read-only).
 */
export const LastPerformanceCard = React.memo(function LastPerformanceCardBase({
  performance,
  timerMode = false,
}: LastPerformanceCardProps) {
  return (
    <Card>
      <Text variant="label" color="textSecondary">
        LAST PERFORMANCE
      </Text>

      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text variant="title" numberOfLines={1} style={styles.routine}>
            {performance.routineName}
          </Text>
          <Text variant="bodySmall" color="textSecondary" style={styles.date}>
            {formatHistoryDate(performance.performedAt)}
          </Text>
        </View>
        <View style={styles.volume}>
          <Text variant="label" color="textSecondary">
            Volume
          </Text>
          <Text variant="title" color="primary" numberOfLines={1} style={styles.volumeValue}>
            {formatVolume(performance.volume)}
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.sets}>
        {performance.sets.map(set => (
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
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  headerMain: {
    flexShrink: 1,
  },
  routine: {
    textTransform: 'capitalize',
  },
  date: {
    marginTop: spacing.xxs,
  },
  volume: {
    alignItems: 'flex-end',
  },
  volumeValue: {
    marginTop: spacing.xxs,
  },
  divider: {
    marginVertical: spacing.md,
  },
  sets: {
    gap: spacing.xs,
  },
});
