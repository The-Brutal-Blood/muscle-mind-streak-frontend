import { useInfiniteQuery } from '@tanstack/react-query';

import type { ApiError } from '@/api/client';

import { getExercises } from '../services/exercise.service';
import type { Exercise, ExerciseFilters, Page } from '../types/exercise.types';

export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (filters: ExerciseFilters) => ['exercises', 'list', filters] as const,
  detail: (id: string) => ['exercises', 'detail', id] as const,
};

/**
 * Infinite, server-filtered exercise list. Changing any filter starts a new
 * cached query; pages accumulate as the user scrolls.
 */
export function useExercises(filters: ExerciseFilters) {
  return useInfiniteQuery<Page<Exercise>, ApiError>({
    queryKey: exerciseKeys.list(filters),
    queryFn: ({ pageParam }) => getExercises(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.last ? undefined : lastPage.number + 1),
    staleTime: 5 * 60 * 1000,
  });
}
