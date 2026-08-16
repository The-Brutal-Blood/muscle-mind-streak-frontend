import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons/ActionIcons';
import { Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import { HelpRequestForm } from '../components/HelpRequestForm';
import type { HelpRequestKind } from '../types/help.types';
import { HELP_REQUEST_COPY } from '../utils/helpRequestCopy';

export interface HelpRequestScreenProps {
  /** Selects the copy and the endpoint the shared form posts to. */
  kind: HelpRequestKind;
  /** Returns to the caller. Navigation is owned by the route wrapper. */
  onBack: () => void;
}

/**
 * Hosts the shared help form for both flows — Report a Bug and Suggest a
 * Feature differ only in the copy resolved from `HELP_REQUEST_COPY`.
 */
export const HelpRequestScreen = React.memo(function HelpRequestScreenBase({
  kind,
  onBack,
}: HelpRequestScreenProps) {
  const copy = HELP_REQUEST_COPY[kind];

  return (
    <Screen scrollable edges={['top']} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <ChevronLeftIcon color={colors.textPrimary} size={24} />
        </Pressable>
        <Text variant="title" accessibilityRole="header">
          {copy.screenTitle}
        </Text>
      </View>

      <Text variant="bodySmall" color="textSecondary" style={styles.intro}>
        {copy.intro}
      </Text>

      <HelpRequestForm kind={kind} onSubmitted={onBack} />
    </Screen>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['5xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    marginLeft: -spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.surface,
  },
  intro: {
    marginTop: spacing.xs,
    marginBottom: spacing['2xl'],
  },
});
