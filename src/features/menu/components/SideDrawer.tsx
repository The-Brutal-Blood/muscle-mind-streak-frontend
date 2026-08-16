import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Divider, Text } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { AppStackParamList } from '@/navigation/AppNavigator';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, shadows, spacing } from '@/theme';

export interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  /** Called for not-yet-built items; the host surfaces a "Coming soon" toast. */
  onComingSoon: (label: string) => void;
  /** Called after the drawer closes; the host opens the Help action sheet. */
  onOpenHelp: () => void;
}

/** Width fraction of the screen the drawer occupies (~80%). */
const PANEL_FRACTION = 0.8;
const OPEN_MS = 260;
const CLOSE_MS = 220;
/**
 * Handoff delay for actions that open another Modal (the Help sheet). At
 * exactly CLOSE_MS the drawer's own Modal is still tearing down, and iOS
 * silently drops a modal presented while another is on screen — so the sheet
 * would never appear. Navigation and Alert handoffs are unaffected.
 */
const SHEET_HANDOFF_MS = CLOSE_MS + 150;

type DrawerAction = 'weight' | 'profile' | 'help' | 'about' | 'logout' | 'comingSoon';

interface DrawerMenuItem {
  key: string;
  emoji: string;
  label: string;
  badge?: string;
  action: DrawerAction;
  /** Renders the label in the error color (e.g. Logout). */
  destructive?: boolean;
}

interface DrawerSection {
  /** Stable list key. */
  id: string;
  /** Section heading; omitted for the standalone logout group. */
  title?: string;
  items: DrawerMenuItem[];
}

const SECTIONS: DrawerSection[] = [
  {
    id: 'account',
    title: 'Account',
    items: [{ key: 'profile', emoji: '👤', label: 'My Profile', action: 'profile' }],
  },
  {
    id: 'tools',
    title: 'Fitness Tools',
    items: [
      { key: 'weight', emoji: '⚖️', label: 'Weight Tracker', action: 'weight' },
      { key: 'calorie', emoji: '🔥', label: 'Calorie Counter', badge: 'Coming Soon', action: 'comingSoon' },
      { key: 'water', emoji: '💧', label: 'Water Tracker', badge: 'Coming Soon', action: 'comingSoon' },
      { key: 'nutrition', emoji: '🥗', label: 'Nutrition', badge: 'Coming Soon', action: 'comingSoon' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    items: [
      { key: 'help', emoji: '❓', label: 'Help', action: 'help' },
      { key: 'about', emoji: 'ℹ️', label: 'About', action: 'about' },
    ],
  },
];

// Pinned to the drawer footer so it always sits at the bottom, not mid-panel.
const LOGOUT_ITEM: DrawerMenuItem = {
  key: 'logout',
  emoji: '🚪',
  label: 'Logout',
  action: 'logout',
  destructive: true,
};

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

interface DrawerRowProps {
  item: DrawerMenuItem;
  onPress: () => void;
}

const DrawerRow = React.memo(function DrawerRowBase({ item, onPress }: DrawerRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.rowEmoji}>{item.emoji}</Text>
      <Text
        variant="body"
        color={item.destructive ? 'error' : 'textPrimary'}
        style={styles.rowLabel}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {item.badge ? (
        <View style={styles.badge}>
          <Text variant="caption" color="textSecondary">
            {item.badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});

/**
 * Left-side navigation drawer for the Home screen. Built on RN core (Modal +
 * Animated) so it needs no extra native dependencies; slides in over the whole
 * screen with a scrim, rounded right edge, and elevation.
 */
export const SideDrawer = React.memo(function SideDrawerBase({
  visible,
  onClose,
  onComingSoon,
  onOpenHelp,
}: SideDrawerProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const reduceMotion = useReducedMotion();

  const panelWidth = width * PANEL_FRACTION;
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }
    if (reduceMotion) {
      progress.setValue(visible ? 1 : 0);
      if (!visible) {
        setMounted(false);
      }
      return undefined;
    }
    const anim = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? OPEN_MS : CLOSE_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
      }
    });
    return () => anim.stop();
  }, [visible, mounted, reduceMotion, progress]);

  if (!mounted) {
    return null;
  }

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });
  const backdropOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const name = user?.fullName ?? user?.email ?? 'Athlete';
  const email = user?.fullName ? user.email : null;
  const initials = user ? initialsOf(user.fullName, user.email) : '🙂';

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to access your workouts.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const handleItem = (item: DrawerMenuItem) => {
    onClose();
    // Let the drawer finish closing before pushing a screen / showing an alert.
    switch (item.action) {
      case 'weight':
        setTimeout(() => navigation.navigate('WeightTracker'), CLOSE_MS);
        break;
      case 'profile':
        setTimeout(() => navigation.navigate('Profile'), CLOSE_MS);
        break;
      case 'about':
        setTimeout(() => navigation.navigate('About'), CLOSE_MS);
        break;
      case 'help':
        // The sheet lives on the host so it survives this drawer unmounting,
        // and waits out this Modal's dismissal before presenting its own.
        setTimeout(onOpenHelp, SHEET_HANDOFF_MS);
        break;
      case 'logout':
        setTimeout(confirmLogout, CLOSE_MS);
        break;
      default:
        onComingSoon(item.label);
    }
  };

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            { width: panelWidth, paddingTop: insets.top, transform: [{ translateX }] },
          ]}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.avatar} accessibilityRole="image" accessibilityLabel="Your avatar">
                <Text variant="headingM" color="primary">
                  {initials}
                </Text>
              </View>
              <Text variant="title" numberOfLines={1}>
                {name}
              </Text>
              {email ? (
                <Text variant="bodySmall" color="textSecondary" numberOfLines={1} style={styles.email}>
                  {email}
                </Text>
              ) : null}
            </View>

            <Divider style={styles.divider} />

            {SECTIONS.map(section => (
              <View key={section.id} style={styles.section}>
                {section.title ? (
                  <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
                    {section.title}
                  </Text>
                ) : null}
                {section.items.map(item => (
                  <DrawerRow key={item.key} item={item} onPress={() => handleItem(item)} />
                ))}
              </View>
            ))}
          </ScrollView>

          <View
            style={[styles.footer, { paddingBottom: Math.max(insets.bottom / 2, spacing.xs) }]}
          >
            <DrawerRow item={LOGOUT_ITEM} onPress={() => handleItem(LOGOUT_ITEM)} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.backgroundSecondary,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  header: {
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  email: {
    marginTop: spacing.xxs,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  rowEmoji: {
    fontSize: 20,
    width: 26,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
  },
  badge: {
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
