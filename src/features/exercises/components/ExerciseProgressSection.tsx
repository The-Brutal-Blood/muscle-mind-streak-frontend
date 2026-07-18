import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatPersonalRecordValue } from '@/utils/personalRecord';

import { ExerciseStatsGrid } from './ExerciseStatsGrid';
import { StrengthProgressChart, type StrengthProgressPoint } from './StrengthProgressChart';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import type { ExercisePersonalRecord } from '../types/exerciseHistory.types';
import { formatHistoryDate } from '../utils/exerciseHistoryFormat';

export interface ExerciseProgressSectionProps {
  exerciseId: string;
}

/**
 * The Summary tab's analytics: Strength Progress chart, the 🏆 Personal
 * Record, and the Statistics grid. Sources GET /exercises/:id/history
 * (shared query cache with the History tab). A never-performed exercise
 * shows only the PR empty state; chart and stats need history.
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

  if (!data) {
    return null;
  }
  const hasHistory = data.history.length > 0;

  return (
    <>
      {hasHistory ? (
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
      ) : null}

      <View style={styles.section}>
        <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
          🏆 Personal Record
        </Text>
        <PersonalRecordCard record={data.personalRecord ?? null} />
      </View>

      {hasHistory ? (
        <View style={styles.section}>
          <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
            Statistics
          </Text>
          <ExerciseStatsGrid statistics={data.statistics} />
        </View>
      ) : null}
    </>
  );
});

/** The all-time best (value + achieved date) or a lightweight empty state. */
function PersonalRecordCard({ record }: { record: ExercisePersonalRecord | null }) {
  if (!record) {
    return (
      <Card>
        <View style={styles.recordEmpty}>
          <Text variant="subtitle" align="center">
            No Personal Record yet.
          </Text>
          <Text variant="bodySmall" color="textSecondary" align="center">
            Complete this exercise to set your first PR.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card
      accessible
      accessibilityLabel={`Personal record: ${formatPersonalRecordValue(record)}, achieved ${formatHistoryDate(record.achievedAt)}`}
    >
      <View style={styles.recordRow}>
        <Text variant="headingM" color="primary" style={styles.recordValue}>
          {formatPersonalRecordValue(record)}
        </Text>
        <View style={styles.recordAchieved}>
          <Text variant="label" color="textSecondary">
            Achieved
          </Text>
          <Text variant="subtitle" style={styles.recordDate}>
            {formatHistoryDate(record.achievedAt)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

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
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  recordValue: {
    flexShrink: 1,
  },
  recordAchieved: {
    alignItems: 'flex-end',
  },
  recordDate: {
    marginTop: spacing.xxs,
  },
  recordEmpty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
