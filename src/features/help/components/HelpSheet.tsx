import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface HelpSheetProps {
  visible: boolean;
  onReportBug: () => void;
  onSuggestFeature: () => void;
  onClose: () => void;
}

interface HelpOption {
  key: string;
  emoji: string;
  label: string;
  hint: string;
  onPress: () => void;
}

/**
 * Bottom-sheet menu behind the drawer's "Help" row: report a bug or suggest a
 * feature. Mirrors the app's other action sheets (backdrop dismiss, rounded
 * top) and the drawer's emoji row language.
 */
export const HelpSheet = React.memo(function HelpSheetBase({
  visible,
  onReportBug,
  onSuggestFeature,
  onClose,
}: HelpSheetProps) {
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  const options: HelpOption[] = [
    {
      key: 'bug',
      emoji: '🐞',
      label: 'Report a Bug',
      hint: 'Something is broken or not working as expected',
      onPress: run(onReportBug),
    },
    {
      key: 'feature',
      emoji: '💡',
      label: 'Suggest a Feature',
      hint: 'Tell us what would make the app better',
      onPress: run(onSuggestFeature),
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdropContainer}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text variant="bodySmall" color="textSecondary" style={styles.title}>
            Help &amp; Support
          </Text>
          {options.map((option, index) => (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityHint={option.hint}
              onPress={option.onPress}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowEmoji}>{option.emoji}</Text>
              <View style={styles.rowText}>
                <Text variant="subtitle">{option.label}</Text>
                <Text variant="bodySmall" color="textSecondary" style={styles.rowHint}>
                  {option.hint}
                </Text>
              </View>
            </Pressable>
          ))}
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
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  rowEmoji: {
    fontSize: 22,
    width: 26,
    textAlign: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowHint: {
    marginTop: spacing.xxs,
  },
});
