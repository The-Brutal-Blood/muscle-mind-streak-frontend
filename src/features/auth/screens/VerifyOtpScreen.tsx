import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius, spacing } from '@/theme';

import { OtpInput } from '../components/OtpInput';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import { otpSchema } from '../validation/auth.schemas';

export interface VerifyOtpScreenProps {
  /** Email the OTP was sent to; also submitted with the verification request. */
  email: string;
  /** Fired once the OTP is accepted. */
  onVerified?: () => void;
  /** Fired when the user taps continue on the success state. Navigation is owned by the caller. */
  onContinue?: () => void;
}

const FORM_SLIDE_DISTANCE = 24;
const RESEND_COOLDOWN_SECONDS = 30;

const SUCCESS_BADGE_SIZE = 88;

export const VerifyOtpScreen = React.memo(function VerifyOtpScreenBase({
  email,
  onVerified,
  onContinue,
}: VerifyOtpScreenProps) {
  const [otp, setOtp] = useState('');
  const verify = useVerifyOtp();
  const verified = verify.isSuccess;
  const otpComplete = otpSchema.safeParse(otp).success;

  const handleOtpChange = (next: string) => {
    // Editing after a failed attempt clears the stale error immediately.
    if (verify.isError) {
      verify.reset();
    }
    setOtp(next);
  };

  const handleVerify = () => {
    if (!otpComplete || verify.isPending || verified) {
      return;
    }
    verify.mutate({ email, otp }, { onSuccess: () => onVerified?.() });
  };

  // Resend cooldown. The countdown/UX is final; once the resend endpoint
  // exists, add postResendEmailOtp() (see auth.api.ts), a service function,
  // a useResendOtp() hook, and call it inside handleResend.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }
    const timer = setTimeout(() => setCooldown(seconds => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0) {
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

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

  // Success state gently scales in once verification lands.
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!verified) {
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
  }, [verified, reduceMotion, successOpacity, successScale]);

  return (
    <Screen scrollable>
      <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
        {verified ? (
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
              Email verified
            </Text>
            <Text variant="body" color="textSecondary" align="center">
              {`${email} is confirmed. Next up: setting up your profile.`}
            </Text>
            <Button
              label="Set Up Profile"
              variant="primary"
              size="lg"
              fullWidth
              onPress={onContinue}
              accessibilityLabel="Set Up Profile"
              accessibilityHint="Continues to profile setup"
              style={styles.successCta}
            />
          </Animated.View>
        ) : (
          <>
            <View style={styles.header}>
              <Text variant="headingXL" accessibilityRole="header">
                Verify your email
              </Text>
              <Text variant="body" color="textSecondary" style={styles.subtitle}>
                Enter the verification code sent to
              </Text>
              <Text variant="subtitle" style={styles.email}>
                {email}
              </Text>
            </View>

            <Animated.View style={[styles.form, { transform: [{ translateY: formTranslateY }] }]}>
              <OtpInput
                value={otp}
                onChange={handleOtpChange}
                disabled={verify.isPending}
                hasError={verify.isError}
                animateFocus={reduceMotion === false}
              />

              {verify.isError ? (
                <View
                  style={styles.errorBox}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  <Text variant="bodySmall" color="error">
                    {verify.error.message}
                  </Text>
                </View>
              ) : null}

              <Button
                label="Verify OTP"
                variant="primary"
                size="lg"
                fullWidth
                loading={verify.isPending}
                disabled={!otpComplete || verify.isPending}
                onPress={handleVerify}
                accessibilityLabel="Verify OTP"
                accessibilityHint="Confirms the verification code sent to your email"
              />

              <View style={styles.resendRow}>
                <Text variant="bodySmall" color="textSecondary">
                  {"Didn't receive the code?"}
                </Text>
                <Button
                  label={cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                  variant="ghost"
                  size="sm"
                  disabled={cooldown > 0}
                  onPress={handleResend}
                  accessibilityLabel="Resend OTP"
                  accessibilityHint="Sends a new verification code to your email"
                />
              </View>
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
    paddingTop: spacing['4xl'],
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  email: {
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing['2xl'],
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  resendRow: {
    alignItems: 'center',
    gap: spacing.xs,
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
  successCta: {
    marginTop: spacing['2xl'],
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
});
