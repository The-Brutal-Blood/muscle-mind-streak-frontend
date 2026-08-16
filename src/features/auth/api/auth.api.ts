import { apiClient } from '@/api/client';

import type {
  AuthSessionResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  LogoutPayload,
  RegisterEmailPayload,
  RegisterEmailResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  VerifyEmailOtpPayload,
  VerifyEmailOtpResponse,
} from '../types/auth.types';

/**
 * Raw transport layer for auth endpoints. No error normalization or business
 * rules here — that lives in auth.service.ts. Screens never import this file.
 */
export const authEndpoints = {
  registerEmail: '/auth/register/email',
  verifyEmailOtp: '/auth/register/email/verify',
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  // Future: resend OTP endpoint plugs in here and gets a matching
  // postResendEmailOtp() + service function + useResendOtp() hook.
  // resendEmailOtp: '/auth/register/email/resend',
} as const;

export async function postRegisterEmail(
  payload: RegisterEmailPayload,
): Promise<RegisterEmailResponse> {
  const { data } = await apiClient.post<RegisterEmailResponse>(
    authEndpoints.registerEmail,
    payload,
  );
  return data;
}

export async function postVerifyEmailOtp(
  payload: VerifyEmailOtpPayload,
): Promise<VerifyEmailOtpResponse> {
  const { data } = await apiClient.post<VerifyEmailOtpResponse>(
    authEndpoints.verifyEmailOtp,
    payload,
  );
  return data;
}

export async function postLogin(payload: LoginPayload): Promise<AuthSessionResponse> {
  const { data } = await apiClient.post<AuthSessionResponse>(authEndpoints.login, payload);
  return data;
}

export async function postLogout(payload: LogoutPayload): Promise<void> {
  await apiClient.post(authEndpoints.logout, payload);
}

export async function postForgotPassword(
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    authEndpoints.forgotPassword,
    payload,
  );
  return data;
}

export async function postResetPassword(
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    authEndpoints.resetPassword,
    payload,
  );
  return data;
}
