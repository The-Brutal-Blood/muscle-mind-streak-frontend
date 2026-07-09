import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import { formatRestOption, REST_TIMER_OPTIONS } from '../utils/restTimer';

export interface RestTimerSheetProps {
  visible: boolean;
  /** Named in the sheet subtitle, e.g. "Rest Timer - Bench Press". */
  exerciseName?: string;
  /** Currently applied rest, in seconds; `null` is off. */
  value: number | null;
  onDone: (value: number | null) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = ITEM_HEIGHT * ((VISIBLE_ITEMS - 1) / 2);

function clampIndex(index: number): number {
  return Math.max(0, Math.min(REST_TIMER_OPTIONS.length - 1, index));
}

/**
 * Bottom-sheet wheel picker for an exercise's rest timer. Scrolls in 5s steps
 * with the centered row highlighted; "Done" commits the centered value.
 */
export const RestTimerSheet = React.memo(function RestTimerSheetBase({
  visible,
  exerciseName,
  value,
  onDone,
  onClose,
}: RestTimerSheetProps) {
  const scrollRef = useRef<ScrollView>(null);

  const initialIndex = useMemo(() => {
    const found = REST_TIMER_OPTIONS.findIndex(option => option === value);
    return found >= 0 ? found : 0;
  }, [value]);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Recenter on the applied value each time the sheet opens.
  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    setSelectedIndex(initialIndex);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [visible, initialIndex]);

  const syncIndexFromOffset = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = clampIndex(Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT));
    setSelectedIndex(current => (current === next ? current : next));
  }, []);

  const handleDone = () => {
    onDone(REST_TIMER_OPTIONS[selectedIndex]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdropContainer}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close rest timer picker"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text variant="title" align="center" accessibilityRole="header" style={styles.title}>
            Rest Timer
          </Text>
          {exerciseName ? (
            <Text variant="bodySmall" color="textSecondary" align="center" style={styles.subtitle}>
              {`Rest Timer - ${exerciseName}`}
            </Text>
          ) : null}

          <View style={styles.picker}>
            <View style={styles.highlight} pointerEvents="none" />
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              scrollEventThrottle={16}
              contentContainerStyle={styles.pickerContent}
              onScroll={syncIndexFromOffset}
              onMomentumScrollEnd={syncIndexFromOffset}
            >
              {REST_TIMER_OPTIONS.map((option, index) => {
                const distance = Math.abs(index - selectedIndex);
                const isSelected = distance === 0;
                const fade =
                  distance === 0 ? styles.fadeNear : distance === 1 ? styles.fadeMid : styles.fadeFar;
                return (
                  <View key={option ?? 'off'} style={styles.item}>
                    <Text
                      variant={isSelected ? 'headingM' : 'subtitle'}
                      color={isSelected ? 'textPrimary' : 'textSecondary'}
                      style={fade}
                    >
                      {formatRestOption(option)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <Button
            label="Done"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleDone}
            accessibilityLabel="Done"
            accessibilityHint="Applies the selected rest timer"
            style={styles.doneButton}
          />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.backdrop,
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as object),
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.md,
  },
  title: {
    marginTop: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  picker: {
    height: PICKER_HEIGHT,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: CENTER_OFFSET,
    height: ITEM_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  pickerContent: {
    paddingVertical: CENTER_OFFSET,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fadeNear: {
    opacity: 1,
  },
  fadeMid: {
    opacity: 0.5,
  },
  fadeFar: {
    opacity: 0.28,
  },
  doneButton: {
    marginTop: spacing.xl,
  },
});
