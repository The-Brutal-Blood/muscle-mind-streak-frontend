import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { ChevronLeftIcon } from '@/components/icons/ActionIcons';
import { Button, Input, Screen, Text } from '@/components/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius, spacing } from '@/theme';

import { useForgotPassword } from '../hooks/useForgotPassword';
import { normalizeEmail } from '../services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../validation/auth.schemas';

export interface ForgotPasswordScreenProps {
  /** Email typed on Login, if any — prefills the field but stays editable. */
  initialEmail?: string;
  /**
   * Fired once the backend has emailed a reset code. Receives the normalized
   * email so the next screen never has to ask for it again.
   */
  onCodeSent?: (email: string) => void;
  /** Returns to the previous screen. Rendered as a back button when provided. */
  onBack?: () => void;
}

const FORM_SLIDE_DISTANCE = 24;

export const ForgotPasswordScreen = React.memo(function ForgotPasswordScreenBase({
  initialEmail,
  onCodeSent,
  onBack,
}: ForgotPasswordScreenProps) {
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { email: initialEmail ?? '' },
  });

  const requestCode = useForgotPassword();

  const onSubmit = handleSubmit(values => {
    if (requestCode.isPending) {
      return;
    }
    const email = normalizeEmail(values.email);
    requestCode.mutate({ email }, { onSuccess: () => onCodeSent?.(email) });
  });

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
            Forgot Password?
          </Text>
          <Text variant="body" color="textSecondary" style={styles.subtitle}>
            {"Enter your email and we'll send you a password reset code."}
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
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                disabled={requestCode.isPending}
                accessibilityHint="Enter the email address for your account"
              />
            )}
          />

          {requestCode.isError ? (
            <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text variant="bodySmall" color="error">
                {requestCode.error.message}
              </Text>
            </View>
          ) : null}

          <Button
            label="Get OTP"
            variant="primary"
            size="lg"
            fullWidth
            loading={requestCode.isPending}
            disabled={!isValid || requestCode.isPending}
            onPress={onSubmit}
            accessibilityLabel="Get OTP"
            accessibilityHint="Emails a password reset code to this address"
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
  errorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
