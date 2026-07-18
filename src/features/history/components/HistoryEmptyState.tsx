import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';

export interface HistoryEmptyStateProps {
  onStartWorkout: () => void;
}

/** Shown when the user has no completed workouts yet. */
export const HistoryEmptyState = React.memo(function HistoryEmptyStateBase({
  onStartWorkout,
}: HistoryEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏋️</Text>
      <Text variant="headingM" align="center" style={styles.title}>
        No workouts yet
      </Text>
      <Text variant="body" color="textSecondary" align="center" style={styles.subtitle}>
        Complete your first workout to build your history.
      </Text>
      <Button
        label="Start Workout"
        variant="primary"
        size="lg"
        onPress={onStartWorkout}
        accessibilityLabel="Start Workout"
        accessibilityHint="Opens the Workout tab to start a routine"
        style={styles.button}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    marginTop: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  // The Button component defaults to alignSelf:'flex-start'; recenter it.
  button: {
    alignSelf: 'center',
  },
});
