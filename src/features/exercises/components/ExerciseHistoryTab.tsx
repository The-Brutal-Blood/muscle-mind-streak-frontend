import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import { ExerciseHistoryEmptyState } from './ExerciseHistoryEmptyState';
import { ExerciseHistorySkeleton } from './ExerciseHistorySkeleton';
import { ExerciseWorkoutHistoryCard } from './ExerciseWorkoutHistoryCard';
import { LastPerformanceCard } from './LastPerformanceCard';
import { useExerciseHistory } from '../hooks/useExerciseHistory';

export interface ExerciseHistoryTabProps {
  exerciseId: string;
}

/**
 * The Exercise Detail "History" tab — the last performance and the full
 * workout log (newest first), sourced from GET /exercises/:id/history.
 * Strength progress and statistics live on the Summary tab. Handles its own
 * loading, error and empty states.
 */
export const ExerciseHistoryTab = React.memo(function ExerciseHistoryTabBase({
  exerciseId,
}: ExerciseHistoryTabProps) {
  const { data, isPending, isError, refetch } = useExerciseHistory(exerciseId);

  // Newest first, regardless of the order the API returns.
  const workouts = useMemo(
    () =>
      [...(data?.history ?? [])].sort((a, b) => b.performedAt.localeCompare(a.performedAt)),
    [data],
  );

  if (isPending) {
    return <ExerciseHistorySkeleton />;
  }

  if (isError) {
    return (
      <View style={styles.stateContainer}>
        <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Text variant="bodySmall" color="error" align="center">
            Unable to load history.
          </Text>
        </View>
        <Button
          label="Retry"
          variant="outline"
          size="md"
          onPress={() => refetch()}
          accessibilityLabel="Retry"
          accessibilityHint="Reloads this exercise's history"
        />
      </View>
    );
  }

  if (data.history.length === 0) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.emptyContent}
        showsVerticalScrollIndicator={false}
      >
        <ExerciseHistoryEmptyState />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Last Performance */}
      {data.lastPerformance ? (
        <LastPerformanceCard
          performance={data.lastPerformance}
          timerMode={data.trackingType === 'TIME'}
        />
      ) : null}

      {/* 2. Workout History */}
      <View style={data.lastPerformance ? styles.section : undefined}>
        <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
          Workout History
        </Text>
        <View style={styles.historyList}>
          {workouts.map(workout => (
            <ExerciseWorkoutHistoryCard
              key={workout.workoutSessionId}
              workout={workout}
              timerMode={data.trackingType === 'TIME'}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['7xl'],
  },
  section: {
    marginTop: spacing['2xl'],
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  historyList: {
    gap: spacing.lg,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing['7xl'],
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  errorBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
