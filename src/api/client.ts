import { Platform } from 'react-native';
import axios, { type InternalAxiosRequestConfig } from 'axios';

import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '@/storage/token.service';


//use below for the local
const DEV_HOST = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});
// const DEV_HOST = 'http://3.110.35.37:8080';

export const API_BASE_URL = `${DEV_HOST}/api`;
export const API_TIMEOUT_MS = 15000;

/**
 * Backend asset URLs (exercise images/gifs) are emitted against localhost;
 * rewrite them onto the platform-correct dev host (10.0.2.2 on Android
 * emulators). No-op for URLs already pointing elsewhere.
 */
export function resolveAssetUrl(url: string): string {
  return url.replace(/^https?:\/\/localhost:8080/, DEV_HOST ?? '');
}

/**
 * Single shared Axios instance. Feature api modules (e.g. auth.api.ts) call
 * this; screens and hooks never import axios directly.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** Every request carries the session's Bearer token when one exists. */
apiClient.interceptors.request.use(config => {
  const accessToken = getAccessToken();
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean;
}

/**
 * Shared in-flight refresh so concurrent 401s trigger exactly one
 * POST /auth/refresh instead of a stampede.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  try {
    // Bare axios: the shared instance's interceptors must not recurse here.
    const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: API_TIMEOUT_MS },
    );
    await saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
    });
    return data.accessToken;
  } catch {
    // Refresh token rejected or unreachable — the session is over.
    await clearTokens();
    return null;
  }
}

/**
 * Access tokens are short-lived (15 min); on a 401 refresh the session once
 * and transparently retry the original request.
 */
apiClient.interceptors.response.use(undefined, async error => {
  const original = (axios.isAxiosError(error) ? error.config : undefined) as
    | RetriableRequestConfig
    | undefined;
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;

  if (status === 401 && original && !original._retriedAfterRefresh && getRefreshToken()) {
    original._retriedAfterRefresh = true;
    refreshPromise = refreshPromise ?? refreshAccessToken();
    const newAccessToken = await refreshPromise;
    refreshPromise = null;
    if (newAccessToken) {
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(original);
    }
  }
  return Promise.reject(error);
});

export type ApiErrorKind = 'network' | 'timeout' | 'validation' | 'server' | 'unknown';

/**
 * Normalized transport error. `message` is always safe to render to the user;
 * `kind`/`status` let callers branch (e.g. retry affordances for 'network').
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

/** Pulls a human-readable message out of common backend error body shapes. */
function extractServerMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const body = data as Record<string, unknown>;
  if (typeof body.message === 'string' && body.message.length > 0) {
    return body.message;
  }
  if (typeof body.error === 'string' && body.error.length > 0) {
    return body.error;
  }
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const first = body.errors[0] as unknown;
    if (typeof first === 'string') {
      return first;
    }
    if (first && typeof first === 'object') {
      const firstMessage = (first as Record<string, unknown>).message;
      if (typeof firstMessage === 'string') {
        return firstMessage;
      }
    }
  }
  return undefined;
}

/** Maps any thrown value onto an ApiError with a user-friendly message. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('timeout', 'The request timed out. Check your connection and try again.');
    }
    if (!error.response) {
      return new ApiError(
        'network',
        'Unable to reach the server. Check your internet connection and try again.',
      );
    }
    const { status, data } = error.response;
    const serverMessage = extractServerMessage(data);
    if (status >= 400 && status < 500) {
      return new ApiError(
        'validation',
        serverMessage ?? 'That request could not be processed. Review your details and try again.',
        status,
      );
    }
    return new ApiError(
      'server',
      serverMessage ?? 'Something went wrong on our end. Please try again shortly.',
      status,
    );
  }
  return new ApiError('unknown', 'Something unexpected happened. Please try again.');
}
