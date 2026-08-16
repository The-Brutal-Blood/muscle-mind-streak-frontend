/** Request/response contracts for the auth endpoints. */

export interface RegisterEmailPayload {
  email: string;
  password: string;
}

export interface RegisterEmailResponse {
  success?: boolean;
  message?: string;
}

export interface VerifyEmailOtpPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

/** Starts a password reset; the backend emails a reset code. */
export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message?: string;
}

/** Completes a password reset. No session is issued — the user signs in again. */
export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message?: string;
}

/** Issued session — returned by both login and OTP verification. */
export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/** Successful verification creates the account and issues the session. */
export type VerifyEmailOtpResponse = AuthSessionResponse;
