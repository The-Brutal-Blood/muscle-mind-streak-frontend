import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/api/client';

import { getCategoryOptions, getEquipmentOptions } from '../services/exercise.service';

/** The library's vocabularies change only on reseed — cache for the session. */
const OPTIONS_STALE_TIME = Infinity;

export function useEquipmentOptions() {
  return useQuery<string[], ApiError>({
    queryKey: ['exercises', 'equipment-options'],
    queryFn: getEquipmentOptions,
    staleTime: OPTIONS_STALE_TIME,
  });
}

export function useCategoryOptions() {
  return useQuery<string[], ApiError>({
    queryKey: ['exercises', 'category-options'],
    queryFn: getCategoryOptions,
    staleTime: OPTIONS_STALE_TIME,
  });
}
