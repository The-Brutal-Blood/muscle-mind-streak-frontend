import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { ExerciseStatsGrid } from './ExerciseStatsGrid';
import { StrengthProgressChart, type StrengthProgressPoint } from './StrengthProgressChart';
import { useExerciseHistory } from '../hooks/useExerciseHistory';

export interface ExerciseProgressSectionProps {
  exerciseId: string;
}

/**
 * The Strength Progress chart and Statistics grid, shown on the Summary tab.
 * Sources GET /exercises/:id/history (shared query cache with the History
 * tab) and renders nothing until data exists — a never-performed exercise
 * keeps its summary clean.
 */
export const ExerciseProgressSection = React.memo(function ExerciseProgressSectionBase({
  exerciseId,
}: ExerciseProgressSectionProps) {
  const { data } = useExerciseHistory(exerciseId);

  // Only points with a recorded max weight are plotted (nulls are dropped).
  const chartPoints = useMemo<StrengthProgressPoint[]>(
    () =>
      (data?.progress ?? [])
        .filter((point): point is { date: string; maxWeight: number } => point.maxWeight != null)
        .map(point => ({ date: point.date, maxWeight: point.maxWeight })),
    [data],
  );

  if (!data || data.history.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.section}>
        <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
          Strength Progress
        </Text>
        <Card>
          {chartPoints.length > 0 ? (
            <StrengthProgressChart points={chartPoints} />
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyEmoji}>📈</Text>
              <Text variant="body" color="textSecondary" align="center">
                No strength data yet.
              </Text>
            </View>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
          Statistics
        </Text>
        <ExerciseStatsGrid statistics={data.statistics} />
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  section: {
    marginTop: spacing['2xl'],
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  chartEmpty: {
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chartEmptyEmoji: {
    fontSize: 32,
  },
});
