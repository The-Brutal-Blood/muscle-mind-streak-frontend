import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/api/client';

import { exerciseKeys } from './useExercises';
import { getExerciseById } from '../services/exercise.service';
import type { Exercise } from '../types/exercise.types';

/**
 * Single exercise detail (GET /exercises/:id) for the info screen. Cached per
 * id; the library rarely changes so keep results fresh for the session.
 */
export function useExerciseDetail(id: string) {
  return useQuery<Exercise, ApiError>({
    queryKey: exerciseKeys.detail(id),
    queryFn: () => getExerciseById(id),
    staleTime: 5 * 60 * 1000,
    enabled: id.length > 0,
  });
}
