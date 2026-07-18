import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import {
  CloseIcon,
  PlusIcon,
  ReorderIcon,
  ReplaceIcon,
} from '@/components/icons/ActionIcons';
import { Text } from '@/components/ui';
import { colors, radius, spacing, type ColorToken } from '@/theme';

export interface ExerciseMenuSheetProps {
  visible: boolean;
  /** Named in the sheet header, e.g. the exercise being acted on. */
  exerciseName?: string;
  onReorder: () => void;
  /** Omit to hide the Replace action (e.g. in the live session). */
  onReplace?: () => void;
  /** Omit to hide the Superset action (e.g. in the live session). */
  onAddToSuperset?: () => void;
  onRemove: () => void;
  onClose: () => void;
}

interface MenuAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: ColorToken;
  onPress: () => void;
}

const ICON_SIZE = 22;

/**
 * Bottom-sheet action menu for a routine exercise: reorder, replace, superset,
 * remove. Mirrors the app's other sheets (backdrop dismiss, rounded top).
 */
export const ExerciseMenuSheet = React.memo(function ExerciseMenuSheetBase({
  visible,
  exerciseName,
  onReorder,
  onReplace,
  onAddToSuperset,
  onRemove,
  onClose,
}: ExerciseMenuSheetProps) {
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  const actions: MenuAction[] = [
    {
      key: 'reorder',
      label: 'Reorder Exercises',
      icon: <ReorderIcon color={colors.textPrimary} size={ICON_SIZE} />,
      color: 'textPrimary',
      onPress: run(onReorder),
    },
    ...(onReplace
      ? [
          {
            key: 'replace',
            label: 'Replace Exercise',
            icon: <ReplaceIcon color={colors.textPrimary} size={ICON_SIZE} />,
            color: 'textPrimary' as ColorToken,
            onPress: run(onReplace),
          },
        ]
      : []),
    ...(onAddToSuperset
      ? [
          {
            key: 'superset',
            label: 'Add To Superset',
            icon: <PlusIcon color={colors.textPrimary} size={ICON_SIZE} />,
            color: 'textPrimary' as ColorToken,
            onPress: run(onAddToSuperset),
          },
        ]
      : []),
    {
      key: 'remove',
      label: 'Remove Exercise',
      icon: <CloseIcon color={colors.error} size={ICON_SIZE} />,
      color: 'error',
      onPress: run(onRemove),
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
          {exerciseName ? (
            <Text
              variant="bodySmall"
              color="textSecondary"
              numberOfLines={1}
              style={styles.title}
            >
              {exerciseName}
            </Text>
          ) : null}
          {actions.map((action, index) => (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.icon}>{action.icon}</View>
              <Text variant="subtitle" color={action.color}>
                {action.label}
              </Text>
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
  icon: {
    width: ICON_SIZE,
    alignItems: 'center',
  },
});
