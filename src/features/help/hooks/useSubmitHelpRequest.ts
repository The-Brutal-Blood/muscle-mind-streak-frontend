import { useMutation } from '@tanstack/react-query';

import type { ApiError } from '@/api/client';

import { submitHelpRequest } from '../services/help.service';
import type { HelpRequestPayload } from '../types/help.types';

/** Submits a bug report or feature suggestion (multipart POST /help/…). */
export function useSubmitHelpRequest() {
  return useMutation<void, ApiError, HelpRequestPayload>({
    mutationFn: submitHelpRequest,
  });
}
