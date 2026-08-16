import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

import { OTP_LENGTH } from '../validation/auth.schemas';

const OTP_BOX_WIDTH = 48;
const OTP_BOX_HEIGHT = 56;
const OTP_BOX_FOCUS_SCALE = 1.08;

export interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  /** Disables the focus scale animation (Reduce Motion). */
  animateFocus?: boolean;
}

/**
 * Six-box OTP field. Models the code as one contiguous string: focus is
 * always redirected to the first empty box, typing advances, backspace on an
 * empty box deletes the previous digit, and a multi-character change (paste
 * or OS one-time-code autofill) is distributed across the boxes.
 *
 * Shared by email verification and password reset — both read the same
 * OTP_LENGTH/otpSchema contract.
 */
export const OtpInput = React.memo(function OtpInputBase({
  value,
  onChange,
  disabled = false,
  hasError = false,
  animateFocus = true,
}: OtpInputProps) {
  const boxRefs = useRef<Array<TextInput | null>>([]);
  const scales = useRef(
    Array.from({ length: OTP_LENGTH }, () => new Animated.Value(1)),
  ).current;
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const scaleTo = useCallback(
    (index: number, toValue: number) => {
      if (!animateFocus) {
        return;
      }
      Animated.timing(scales[index], {
        toValue,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    },
    [animateFocus, scales],
  );

  const handleFocus = (index: number) => {
    // Keep the code contiguous: focusing past the first empty box snaps back.
    const firstEmpty = Math.min(value.length, OTP_LENGTH - 1);
    if (index > firstEmpty) {
      boxRefs.current[firstEmpty]?.focus();
      return;
    }
    setFocusedIndex(index);
    scaleTo(index, OTP_BOX_FOCUS_SCALE);
  };

  const handleBlur = (index: number) => {
    setFocusedIndex(current => (current === index ? null : current));
    scaleTo(index, 1);
  };

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/\D+/g, '');
    if (digits.length === 0) {
      // Backspace cleared this box; shift any following digits left.
      onChange(value.slice(0, index) + value.slice(index + 1));
      return;
    }
    // Single digit, paste, or OS autofill — insert starting at this box.
    const next = (value.slice(0, index) + digits + value.slice(index + digits.length)).slice(
      0,
      OTP_LENGTH,
    );
    onChange(next);
    if (next.length >= OTP_LENGTH) {
      boxRefs.current[index]?.blur();
    } else {
      boxRefs.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus();
    }
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key !== 'Backspace' || value[index] || index === 0) {
      return;
    }
    // Backspace on an empty box removes the previous digit.
    onChange(value.slice(0, index - 1) + value.slice(index));
    boxRefs.current[index - 1]?.focus();
  };

  return (
    <View
      style={styles.otpRow}
      accessibilityHint={`Enter the ${OTP_LENGTH}-digit verification code`}
    >
      {Array.from({ length: OTP_LENGTH }, (_, index) => {
        const isFocused = focusedIndex === index;
        const borderColor = hasError
          ? colors.error
          : isFocused
          ? colors.primary
          : colors.border;
        return (
          <Animated.View key={index} style={{ transform: [{ scale: scales[index] }] }}>
            <TextInput
              ref={element => {
                boxRefs.current[index] = element;
              }}
              value={value[index] ?? ''}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={event => handleKeyPress(event, index)}
              onFocus={() => handleFocus(index)}
              onBlur={() => handleBlur(index)}
              editable={!disabled}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              selectTextOnFocus
              maxFontSizeMultiplier={1.3}
              style={[styles.otpBox, { borderColor }]}
              accessibilityLabel={`Verification code digit ${index + 1} of ${OTP_LENGTH}`}
              accessibilityState={{ disabled }}
            />
          </Animated.View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  otpBox: {
    ...typography.headingM,
    width: OTP_BOX_WIDTH,
    height: OTP_BOX_HEIGHT,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
  },
});
