import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { secondsToDuration } from '@/utils/duration';

import { formatSetValue } from '../utils/exerciseHistoryFormat';

export interface ExerciseSetRowProps {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  /** TIME tracking, in seconds; rendered as MM:SS instead of load × reps. */
  duration?: number | null;
  /** True when the exercise is TIME-tracked (backend `trackingType`). */
  timerMode?: boolean;
}

/**
 * One completed set, read-only. Echoes the live workout row — a set label on
 * the left and the value (load × reps, or MM:SS for TIME tracking) in an
 * elevated pill on the right — but is never editable.
 */
export const ExerciseSetRow = React.memo(function ExerciseSetRowBase({
  setNumber,
  weight,
  reps,
  duration,
  timerMode = false,
}: ExerciseSetRowProps) {
  const value = timerMode
    ? duration != null
      ? secondsToDuration(duration)
      : '-'
    : formatSetValue(weight ?? 0, reps ?? 0);

  return (
    <View style={styles.row}>
      <Text variant="subtitle" color="textSecondary">
        {`Set ${setNumber}`}
      </Text>
      <View style={styles.valuePill}>
        <Text variant="subtitle" color="textPrimary">
          {value}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  valuePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
});
