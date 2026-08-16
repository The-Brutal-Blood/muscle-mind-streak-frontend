import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons/ActionIcons';
import { Button, Card, Divider, Loader, Logo, Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { openEmail, openExternalUrl } from '@/utils/linking';

import { useAbout } from '../hooks/useAbout';

export interface AboutScreenProps {
  /** Returns to the caller. Navigation is owned by the route wrapper. */
  onBack: () => void;
}

interface LinkRowProps {
  label: string;
  value: string;
  onPress: () => void;
  accessibilityHint: string;
}

/** Label above a tappable value, styled like the profile detail rows. */
const LinkRow = React.memo(function LinkRowBase({
  label,
  value,
  onPress,
  accessibilityHint,
}: LinkRowProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
    >
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="subtitle" color="primary" numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
});

const BackHeader = React.memo(function BackHeaderBase({ onBack }: { onBack: () => void }) {
  return (
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
        About
      </Text>
    </View>
  );
});

/** App metadata, rendered entirely from GET /help/about. */
export const AboutScreen = React.memo(function AboutScreenBase({ onBack }: AboutScreenProps) {
  const { data, isPending, isError, error, refetch } = useAbout();

  if (isPending) {
    return (
      <Screen edges={['top']}>
        <BackHeader onBack={onBack} />
        <Loader fullscreen />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen edges={['top']}>
        <BackHeader onBack={onBack} />
        <View style={styles.errorState}>
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text variant="bodySmall" color="error" align="center">
              {error.message}
            </Text>
          </View>
          <Button
            label="Try Again"
            variant="outline"
            size="md"
            onPress={() => refetch()}
            accessibilityLabel="Try Again"
            accessibilityHint="Reloads the app information"
            style={styles.retryButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable edges={['top']} contentContainerStyle={styles.content}>
      <BackHeader onBack={onBack} />

      <View style={styles.identity}>
        <Logo size="small" accessibilityLabel={data.appName} />
        <Text variant="headingL" align="center" accessibilityRole="header">
          {data.appName}
        </Text>
        <Text variant="bodySmall" color="textSecondary" align="center">
          Version {data.version}
        </Text>
        <Text variant="body" color="textSecondary" align="center" style={styles.description}>
          {data.description}
        </Text>
      </View>

      <Card padding="lg">
        <LinkRow
          label="Support"
          value={data.supportEmail}
          onPress={() => openEmail(data.supportEmail, `${data.appName} support`)}
          accessibilityHint="Opens your mail app to contact support"
        />
        <Divider />
        <LinkRow
          label="Website"
          value={data.websiteUrl}
          onPress={() => openExternalUrl(data.websiteUrl)}
          accessibilityHint="Opens the website in your browser"
        />
      </Card>
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
  identity: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  description: {
    marginTop: spacing.md,
  },
  linkRow: {
    gap: spacing.xxs,
    paddingVertical: spacing.md,
  },
  linkRowPressed: {
    opacity: 0.7,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  retryButton: {
    alignSelf: 'center',
  },
});
