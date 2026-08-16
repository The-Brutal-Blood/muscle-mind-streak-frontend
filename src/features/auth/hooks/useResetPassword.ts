import { useMutation } from '@tanstack/react-query';

import type { ApiError } from '@/api/client';

import { resetPassword } from '../services/auth.service';
import type { ResetPasswordPayload, ResetPasswordResponse } from '../types/auth.types';

/** Sets a new password from an emailed reset code. Issues no session. */
export function useResetPassword() {
  return useMutation<ResetPasswordResponse, ApiError, ResetPasswordPayload>({
    mutationKey: ['auth', 'reset-password'],
    mutationFn: resetPassword,
  });
}
