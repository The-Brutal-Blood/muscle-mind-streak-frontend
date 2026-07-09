import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Divider, Loader, Screen, Text } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';
import type { Gender } from '@/types/user.types';

const AVATAR_SIZE = 96;

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Prefer not to say',
};

/** 180 → "180 cm (5'11\")" — appends the rounded imperial equivalent. */
function formatHeight(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${cm} cm (${feet}'${inches}")`;
}

/** "Hemant Kashyap" → "HK"; falls back to the first letter of the email. */
function initialsOf(fullName: string | null, email: string): string {
  const source = fullName?.trim();
  if (!source) {
    return email.charAt(0).toUpperCase();
  }
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow = React.memo(function DetailRowBase({ label, value }: DetailRowProps) {
  return (
    <View
      style={styles.detailRow}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="subtitle">{value}</Text>
    </View>
  );
});

export const ProfileScreen = React.memo(function ProfileScreenBase() {
  const { logout } = useAuth();
  const { data: user, isPending } = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    // logout() never throws — server revocation is best-effort and local
    // sign-out always completes; unmount follows via the navigator swap.
    await logout();
  };

  if (isPending || !user) {
    return (
      <Screen edges={['top']}>
        <Loader fullscreen />
      </Screen>
    );
  }

  return (
    <Screen scrollable edges={['top']}>
      <View style={styles.root}>
        <View style={styles.identity}>
          <View style={styles.avatar} accessibilityRole="image" accessibilityLabel="Your avatar">
            <Text variant="headingXL" color="primary">
              {initialsOf(user.fullName, user.email)}
            </Text>
          </View>
          <Text variant="headingL" align="center" accessibilityRole="header">
            {user.fullName ?? user.email}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {user.email}
          </Text>
        </View>

        <Card padding="lg">
          <DetailRow
            label="Gender"
            value={user.gender ? GENDER_LABELS[user.gender] : 'Not set'}
          />
          <Divider />
          <DetailRow
            label="Height"
            value={user.heightCm != null ? formatHeight(user.heightCm) : 'Not set'}
          />
          <Divider />
          <DetailRow
            label="Weight"
            value={user.weightKg != null ? `${user.weightKg} kg` : 'Not set'}
          />
        </Card>

        <View style={styles.footer}>
          <Button
            label="Logout"
            variant="primary"
            size="lg"
            fullWidth
            loading={loggingOut}
            disabled={loggingOut}
            onPress={handleLogout}
            accessibilityLabel="Logout"
            accessibilityHint="Signs you out of your account"
          />
        </View>
      </View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: spacing['2xl'],
    gap: spacing['3xl'],
  },
  identity: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
});
