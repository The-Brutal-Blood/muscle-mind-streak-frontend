import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import type { BrokenPersonalRecord } from '@/features/workout/types/workout.types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius, spacing } from '@/theme';
import { secondsToDuration } from '@/utils/duration';
import { formatPersonalRecordValue } from '@/utils/personalRecord';

export interface PersonalRecordBannerProps {
  records: BrokenPersonalRecord[];
  onDismiss: () => void;
}

/** Drops float noise from a weight: 30 → "30", 22.5 → "22.5". */
function trimWeight(weight: number): string {
  return String(Math.round(weight * 100) / 100);
}

/** "95 → 100 kg" / "02:00 → 02:30"; just the new value on a first PR. */
function formatImprovement(record: BrokenPersonalRecord): string {
  const { previous, current } = record;
  const newValue = formatPersonalRecordValue({
    trackingType: record.trackingType,
    ...current,
  });
  // First PR for this exercise: nothing beaten, show the new record alone.
  if (previous == null) {
    return newValue;
  }
  if (record.trackingType === 'TIME') {
    const next = current.duration != null ? secondsToDuration(current.duration) : '-';
    return previous.duration != null
      ? `${secondsToDuration(previous.duration)} → ${next}`
      : newValue;
  }
  if (previous.weight == null || current.weight == null) {
    return newValue;
  }
  return `${trimWeight(previous.weight)} → ${trimWeight(current.weight)} kg`;
}

/**
 * Center-screen PR celebration shown on Home after a workout that broke at
 * least one record: dimmed backdrop, a big card that springs in, and a large
 * pulsing 🎉 (reduced-motion aware). Dismissed via the close button or a
 * backdrop tap; never reappears afterwards.
 */
export const PersonalRecordBanner = React.memo(function PersonalRecordBannerBase({
  records,
  onDismiss,
}: PersonalRecordBannerProps) {
  const reduceMotion = useReducedMotion();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion === null) {
      return undefined;
    }
    if (reduceMotion) {
      backdropOpacity.setValue(1);
      cardOpacity.setValue(1);
      cardScale.setValue(1);
      emojiScale.setValue(1);
      return undefined;
    }
    // Backdrop fades, the card springs in, the emoji pops then keeps pulsing.
    const entrance = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        bounciness: 9,
        speed: 14,
        useNativeDriver: true,
      }),
      Animated.spring(emojiScale, {
        toValue: 1,
        bounciness: 14,
        speed: 8,
        useNativeDriver: true,
      }),
    ]);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(emojiScale, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(emojiScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    entrance.start(({ finished }) => {
      if (finished) {
        pulse.start();
      }
    });
    return () => {
      entrance.stop();
      pulse.stop();
    };
  }, [reduceMotion, backdropOpacity, cardOpacity, cardScale, emojiScale]);

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss celebration"
        />
      </Animated.View>

      <Animated.View
        style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
        accessibilityLiveRegion="polite"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          accessibilityHint="Closes the personal record celebration"
          onPress={onDismiss}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <CloseIcon color={colors.textSecondary} size={20} />
        </Pressable>

        <Animated.Text style={[styles.emoji, { transform: [{ scale: emojiScale }] }]}>
          🎉
        </Animated.Text>
        <Text variant="headingM" color="primary" align="center">
          New Personal Record!
        </Text>

        <View style={styles.records}>
          {records.map(record => (
            <View key={`${record.exerciseId}:${record.exerciseName}`} style={styles.recordRow}>
              <Text variant="subtitle" numberOfLines={2} style={styles.exercise}>
                {record.exerciseName}
              </Text>
              <Text variant="subtitle" color="primary" style={styles.value}>
                {formatImprovement(record)}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...(StyleSheet.absoluteFill as object),
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: colors.backdrop,
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonPressed: {
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: 72,
    marginBottom: spacing.lg,
  },
  records: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  exercise: {
    flex: 1,
    textTransform: 'capitalize',
  },
  value: {
    flexShrink: 0,
  },
});
