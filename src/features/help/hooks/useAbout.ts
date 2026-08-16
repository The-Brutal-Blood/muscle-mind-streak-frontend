import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/api/client';

import { getAbout } from '../services/help.service';
import type { AboutInfo } from '../types/help.types';

/** Cache namespace for /help data. */
export const helpKeys = {
  about: ['help', 'about'] as const,
};

/** App metadata for the About screen (GET /help/about). Changes per release,
 *  so it stays fresh for an hour rather than being refetched on every visit. */
export function useAbout() {
  return useQuery<AboutInfo, ApiError>({
    queryKey: helpKeys.about,
    queryFn: getAbout,
    staleTime: 60 * 60 * 1000,
  });
}
