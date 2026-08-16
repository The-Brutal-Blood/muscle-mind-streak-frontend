import { useMutation } from '@tanstack/react-query';

import type { ApiError } from '@/api/client';

import { forgotPassword } from '../services/auth.service';
import type { ForgotPasswordPayload, ForgotPasswordResponse } from '../types/auth.types';

/**
 * Requests a password-reset code. On success the backend has emailed the OTP;
 * the caller should route to the Reset Password screen.
 */
export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, ApiError, ForgotPasswordPayload>({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: forgotPassword,
  });
}
