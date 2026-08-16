import { z } from 'zod';

/** Single source of truth for auth form validation — never duplicated in screens. */

export const PASSWORD_MIN_LENGTH = 8;
export const OTP_LENGTH = 6;

/**
 * The account password policy. Shared by signup and password reset so the
 * rules can never drift apart between the two flows.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[0-9]/, 'Include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Include at least one special character');

export const signupSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine(values => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

/**
 * Login validates presence only — password rules are enforced at signup,
 * and leaking which rule failed would help nobody but an attacker.
 */
export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const otpSchema = z
  .string()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`);

/** Step 1 of the reset flow: which account to email a reset code to. */
export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/**
 * Step 2: the emailed code plus the new password. The email is carried as a
 * route param, not re-entered, so it is not part of this form.
 */
export const resetPasswordSchema = z
  .object({
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine(values => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
