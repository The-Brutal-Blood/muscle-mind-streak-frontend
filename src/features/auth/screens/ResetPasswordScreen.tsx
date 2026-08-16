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
import { colors, radius, spacing } from '@/theme';

import { OtpInput } from '../components/OtpInput';
import { useResetPassword } from '../hooks/useResetPassword';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../validation/auth.schemas';

export interface ResetPasswordScreenProps {
  /** Email the reset code was sent to; submitted with the request. Not editable here. */
  email: string;
  /** Fired when the user taps continue on the success state. Navigation is owned by the caller. */
  onDone?: () => void;
  /** Returns to the previous screen. Rendered as a back button when provided. */
  onBack?: () => void;
}

const FORM_SLIDE_DISTANCE = 24;
const SUCCESS_BADGE_SIZE = 88;

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
}

/** Show/Hide affordance for password fields. */
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

export const ResetPasswordScreen = React.memo(function ResetPasswordScreenBase({
  email,
  onDone,
  onBack,
}: ResetPasswordScreenProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const confirmRef = useRef<RNTextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  const reset = useResetPassword();
  const succeeded = reset.isSuccess;

  const onSubmit = handleSubmit(values => {
    if (reset.isPending || succeeded) {
      return;
    }
    // confirmPassword is a client-side check only; it never leaves the app.
    reset.mutate({ email, otp: values.otp, newPassword: values.newPassword });
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

  // Success state gently scales in once the reset lands (matches Verify OTP).
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!succeeded) {
      return;
    }
    if (reduceMotion) {
      successOpacity.setValue(1);
      successScale.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(successScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [succeeded, reduceMotion, successOpacity, successScale]);

  return (
    <Screen scrollable>
      <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
        {succeeded ? (
          <Animated.View
            style={[
              styles.successArea,
              { opacity: successOpacity, transform: [{ scale: successScale }] },
            ]}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.successBadge}>
              <View style={styles.successBadgeFill} />
              <Text variant="displayL" color="success" accessibilityLabel="Success">
                ✓
              </Text>
            </View>
            <Text variant="headingL" align="center" accessibilityRole="header">
              Password reset successfully.
            </Text>
            <Text variant="body" color="textSecondary" align="center">
              Sign in with your new password to continue your training.
            </Text>
            <Button
              label="Back to Sign In"
              variant="primary"
              size="lg"
              fullWidth
              onPress={onDone}
              accessibilityLabel="Back to Sign In"
              accessibilityHint="Returns to the sign in screen"
              style={styles.successCta}
            />
          </Animated.View>
        ) : (
          <>
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
                Reset Password
              </Text>
              <Text variant="body" color="textSecondary" style={styles.subtitle}>
                Enter the code sent to your email and choose a new password.
              </Text>
              <Text variant="bodySmall" color="textSecondary" style={styles.sentToLabel}>
                Code sent to
              </Text>
              <Text variant="subtitle">{email}</Text>
            </View>

            <Animated.View style={[styles.form, { transform: [{ translateY: formTranslateY }] }]}>
              <Controller
                control={control}
                name="otp"
                render={({ field: { value, onChange }, fieldState: { error } }) => (
                  <View>
                    <Text variant="label" color="textSecondary" style={styles.otpLabel}>
                      Verification Code
                    </Text>
                    <OtpInput
                      value={value}
                      onChange={onChange}
                      disabled={reset.isPending}
                      hasError={Boolean(error)}
                      animateFocus={reduceMotion === false}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="newPassword"
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                  <Input
                    label="New Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    helperText="Min 8 characters with uppercase, lowercase, number and special character."
                    placeholder="Create a new password"
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    // iOS "new password" autofill draws an opaque cover view over
                    // the form unless Associated Domains are configured; opt out
                    // until webcredentials support exists.
                    autoComplete="off"
                    textContentType="none"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                    disabled={reset.isPending}
                    rightIcon={
                      <VisibilityToggle
                        visible={passwordVisible}
                        onToggle={() => setPasswordVisible(current => !current)}
                      />
                    }
                    accessibilityHint="Create a new password for your account"
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                  <Input
                    ref={confirmRef}
                    label="Confirm Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    placeholder="Re-enter your new password"
                    secureTextEntry={!confirmVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                    disabled={reset.isPending}
                    rightIcon={
                      <VisibilityToggle
                        visible={confirmVisible}
                        onToggle={() => setConfirmVisible(current => !current)}
                      />
                    }
                    accessibilityHint="Re-enter your new password to confirm it"
                  />
                )}
              />

              {reset.isError ? (
                <View
                  style={styles.errorBox}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  <Text variant="bodySmall" color="error">
                    {reset.error.message}
                  </Text>
                </View>
              ) : null}

              <Button
                label="Reset Password"
                variant="primary"
                size="lg"
                fullWidth
                loading={reset.isPending}
                disabled={!isValid || reset.isPending}
                onPress={onSubmit}
                accessibilityLabel="Reset Password"
                accessibilityHint="Sets your new password using the emailed code"
                style={styles.submit}
              />
            </Animated.View>
          </>
        )}
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
  sentToLabel: {
    marginTop: spacing.lg,
  },
  form: {
    gap: spacing.xl,
  },
  otpLabel: {
    marginBottom: spacing.sm,
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
  },
  successArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  successBadge: {
    width: SUCCESS_BADGE_SIZE,
    height: SUCCESS_BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successBadgeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: SUCCESS_BADGE_SIZE / 2,
    backgroundColor: colors.success,
    opacity: 0.15,
  },
  successCta: {
    marginTop: spacing['2xl'],
  },
});
