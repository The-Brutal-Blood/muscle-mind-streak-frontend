import { apiClient, API_TIMEOUT_MS, toApiError } from '@/api/client';

import type { AboutInfo, HelpRequestKind, HelpRequestPayload } from '../types/help.types';

/**
 * Help service — the single gateway for /help. Reuses the shared API client,
 * so auth headers, token refresh and error normalization come for free.
 */

const ABOUT_ENDPOINT = '/help/about';

const SUBMIT_ENDPOINTS: Record<HelpRequestKind, string> = {
  REPORT_BUG: '/help/report-bug',
  SUGGEST_FEATURE: '/help/suggestion',
};

/** App metadata shown on the About screen. */
export async function getAbout(): Promise<AboutInfo> {
  try {
    const { data } = await apiClient.get<AboutInfo>(ABOUT_ENDPOINT);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Submits a bug report or feature suggestion with its optional screenshots. */
export async function submitHelpRequest({
  kind,
  title,
  description,
  images,
}: HelpRequestPayload): Promise<void> {
  const formData = new FormData();
  formData.append('title', title.trim());
  formData.append('description', description.trim());
  // Repeated `images` parts — the backend accepts up to three.
  images.forEach(image => {
    formData.append('images', { uri: image.uri, name: image.name, type: image.type });
  });

  try {
    await apiClient.post(SUBMIT_ENDPOINTS[kind], formData, {
      // Overrides the client's JSON default so axios forwards the FormData
      // untouched; React Native's networking layer appends the boundary.
      headers: { 'Content-Type': 'multipart/form-data' },
      // Uploading up to three full-resolution photos needs more headroom than
      // the client's default JSON timeout.
      timeout: API_TIMEOUT_MS * 4,
    });
  } catch (error) {
    throw toApiError(error);
  }
}
