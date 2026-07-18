import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type TextInput as RNTextInput,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { ChevronLeftIcon } from '@/components/icons/ActionIcons';
import { Button, Input, Screen, Text } from '@/components/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';
import type { UserProfile } from '@/types/user.types';

import { loginSchema, type LoginFormValues } from '../validation/auth.schemas';

export interface LoginScreenProps {
  /**
   * Fired when login succeeds but the profile is incomplete — the caller
   * routes into onboarding. (A completed profile flips the auth state, and
   * the navigator switches to the app tabs on its own.)
   */
  onNeedsProfileSetup?: (user: UserProfile) => void;
  /** Returns to the previous screen. Rendered as a back button when provided. */
  onBack?: () => void;
}

const FORM_SLIDE_DISTANCE = 24;

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
}

/** Show/Hide affordance for the password field. */
const VisibilityToggle = React.memo(function VisibilityToggleBase({
  visible,
  onToggle,
}: VisibilityToggleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      onPress={onToggle}
      hitSlop={spacing.sm}
    >
      <Text variant="label" color="primary">
        {visible ? 'Hide' : 'Show'}
      </Text>
    </Pressable>
  );
});

export const LoginScreen = React.memo(function LoginScreenBase({
  onNeedsProfileSetup,
  onBack,
}: LoginScreenProps) {
  const { login } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const passwordRef = useRef<RNTextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async values => {
    if (pending) {
      return;
    }
    setPending(true);
    setSubmitError(null);
    try {
      const user = await login(values);
      if (!user.profileCompleted) {
        onNeedsProfileSetup?.(user);
      }
      // Completed profile: the AuthProvider flipped to 'authenticated' and
      // the root navigator is already swapping to the app tabs.
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setPending(false);
    }
  });

  // Forgot Password is UI-only for now; the reset flow ships with its own
  // backend endpoint later.
  const handleForgotPassword = () => {};

  // Entrance: screen fades in while the form slides up.
  const reduceMotion = useReducedMotion();
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(FORM_SLIDE_DISTANCE)).current;

  useEffect(() => {
    if (reduceMotion === null) {
      return undefined;
    }
    if (reduceMotion) {
      screenOpacity.setValue(1);
      formTranslateY.setValue(0);
      return undefined;
    }
    const easeOut = Easing.out(Easing.cubic);
    const entrance = Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 450,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 500,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [reduceMotion, screenOpacity, formTranslateY]);

  return (
    <Screen scrollable>
      <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Returns to the previous screen"
            onPress={onBack}
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <ChevronLeftIcon color={colors.textPrimary} size={24} />
          </Pressable>
        ) : null}
        <View style={styles.header}>
          <Text variant="headingXL" accessibilityRole="header">
            Welcome back
          </Text>
          <Text variant="body" color="textSecondary" style={styles.subtitle}>
            Sign in to continue your training.
          </Text>
        </View>

        <Animated.View style={[styles.form, { transform: [{ translateY: formTranslateY }] }]}>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={error?.message}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                disabled={pending}
                accessibilityHint="Enter the email address for your account"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
              <Input
                ref={passwordRef}
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={error?.message}
                placeholder="Your password"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                disabled={pending}
                rightIcon={
                  <VisibilityToggle
                    visible={passwordVisible}
                    onToggle={() => setPasswordVisible(current => !current)}
                  />
                }
                accessibilityHint="Enter your password"
              />
            )}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Forgot Password"
            accessibilityHint="Password reset is coming soon"
            onPress={handleForgotPassword}
            hitSlop={spacing.sm}
            style={styles.forgotRow}
          >
            <Text variant="label" color="primary">
              Forgot Password?
            </Text>
          </Pressable>

          {submitError ? (
            <View
              style={styles.errorBox}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <Text variant="bodySmall" color="error">
                {submitError}
              </Text>
            </View>
          ) : null}

          <Button
            label="Sign In"
            variant="primary"
            size="lg"
            fullWidth
            loading={pending}
            disabled={!isValid || pending}
            onPress={onSubmit}
            accessibilityLabel="Sign In"
            accessibilityHint="Signs in to your account"
          />
        </Animated.View>
      </Animated.View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    marginLeft: -spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.surface,
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.xl,
  },
  forgotRow: {
    alignSelf: 'flex-end',
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
