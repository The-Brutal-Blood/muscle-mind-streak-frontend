import React from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CheckIcon } from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { durationToSeconds, secondsToDuration } from '@/utils/duration';

import type { WorkoutPreviousSet, WorkoutSetState } from '../types/workout.types';
import {
  normalizeDuration,
  sanitizeDuration,
  sanitizeReps,
  sanitizeWeight,
} from '../utils/inputSanitizers';
import { parseNumericField } from '../utils/workoutSession';

export interface WorkoutSetRowProps {
  index: number;
  set: WorkoutSetState;
  previous?: WorkoutPreviousSet;
  /** Timer Mode: a single duration input replaces the weight/reps inputs. */
  timerMode?: boolean;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  onChangeDuration: (value: string) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
}

const CHECK_SIZE = 28;

function formatPrevious(previous: WorkoutPreviousSet | undefined, timerMode: boolean): string {
  if (!previous) {
    return '-';
  }
  if (timerMode) {
    return previous.duration != null ? secondsToDuration(previous.duration) : '-';
  }
  if (previous.weight == null || previous.reps == null) {
    return '-';
  }
  return `${previous.weight} × ${previous.reps}`;
}

/** One logged set: number, previous, editable weight/reps, completion toggle. */
export const WorkoutSetRow = React.memo(function WorkoutSetRowBase({
  index,
  set,
  previous,
  timerMode = false,
  onChangeWeight,
  onChangeReps,
  onChangeDuration,
  onToggleComplete,
  onRemove,
}: WorkoutSetRowProps) {
  const confirmRemove = () => {
    Alert.alert('Remove set', `Remove set ${index + 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemove },
    ]);
  };

  // A set may only be ticked once it holds a loggable value — reps in normal
  // mode (weight is optional, e.g. bodyweight exercises), a non-zero duration
  // in Timer Mode. Unticking a completed set is always allowed.
  const hasValues = timerMode
    ? (durationToSeconds(set.duration ?? '') ?? 0) > 0
    : parseNumericField(set.reps) != null;
  const checkDisabled = !set.completed && !hasValues;

  return (
    <Pressable
      onLongPress={confirmRemove}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`Set ${index + 1}`}
      accessibilityHint="Long press to remove this set"
      style={[styles.row, set.completed && styles.rowCompleted]}
    >
      <Text variant="subtitle" style={columns.set}>
        {index + 1}
      </Text>
      <Text variant="bodySmall" color="textSecondary" numberOfLines={1} style={columns.previous}>
        {formatPrevious(previous, timerMode)}
      </Text>
      {timerMode ? (
        <View style={columns.time}>
          <TextInput
            value={set.duration ?? ''}
            onChangeText={value => onChangeDuration(sanitizeDuration(value))}
            onEndEditing={() => onChangeDuration(normalizeDuration(set.duration ?? ''))}
            placeholder="00:00"
            placeholderTextColor={colors.placeholder}
            selectionColor={colors.primary}
            keyboardType="numbers-and-punctuation"
            maxLength={6}
            style={[styles.input, set.prefilled && styles.inputPrefilled]}
            accessibilityLabel={`Set ${index + 1} duration in minutes and seconds`}
          />
        </View>
      ) : (
        <>
          <View style={columns.value}>
            <TextInput
              value={set.weight}
              onChangeText={value => onChangeWeight(sanitizeWeight(value))}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.primary}
              keyboardType="numeric"
              maxLength={6}
              style={[styles.input, set.prefilled && styles.inputPrefilled]}
              accessibilityLabel={`Set ${index + 1} weight in kilograms`}
            />
          </View>
          <View style={columns.value}>
            <TextInput
              value={set.reps}
              onChangeText={value => onChangeReps(sanitizeReps(value))}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.primary}
              keyboardType="numeric"
              maxLength={4}
              style={[styles.input, set.prefilled && styles.inputPrefilled]}
              accessibilityLabel={`Set ${index + 1} repetitions`}
            />
          </View>
        </>
      )}
      <View style={columns.check}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.completed, disabled: checkDisabled }}
          accessibilityLabel={`Set ${index + 1} completed`}
          accessibilityHint={
            checkDisabled ? (timerMode ? 'Enter a duration first' : 'Enter reps first') : undefined
          }
          disabled={checkDisabled}
          onPress={onToggleComplete}
          hitSlop={spacing.sm}
          style={[
            styles.checkbox,
            set.completed && styles.checkboxChecked,
            checkDisabled && styles.checkboxDisabled,
          ]}
        >
          {set.completed ? <CheckIcon color={colors.textOnPrimary} size={18} /> : null}
        </Pressable>
      </View>
    </Pressable>
  );
});

/** Shared column widths so the card header and rows stay aligned. */
export const columns = StyleSheet.create({
  set: {
    width: 28,
    textAlign: 'center',
  },
  previous: {
    flex: 1.3,
    textAlign: 'center',
  },
  value: {
    flex: 1,
    alignItems: 'center',
  },
  valueHeader: {
    flex: 1,
    textAlign: 'center',
  },
  /** Timer Mode: one TIME column spanning the space of KG + REPS. */
  time: {
    flex: 2,
    alignItems: 'center',
  },
  timeHeader: {
    flex: 2,
    textAlign: 'center',
  },
  check: {
    width: 40,
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  rowCompleted: {
    backgroundColor: colors.primarySoft,
  },
  input: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: 'center',
    minWidth: 56,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  // Values carried over from the previous set look like placeholders until
  // the user edits or completes the set.
  inputPrefilled: {
    color: colors.placeholder,
  },
  checkbox: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxDisabled: {
    opacity: 0.4,
  },
});
