import { apiClient, resolveAssetUrl, toApiError } from '@/api/client';

import type { Exercise, ExerciseFilters, Page } from '../types/exercise.types';

/**
 * Exercise library service — the single gateway for /exercises requests.
 * Normalizes errors and rewrites asset URLs onto the platform-correct host.
 */

const EXERCISES_ENDPOINT = '/exercises';
export const EXERCISES_PAGE_SIZE = 20;

function withResolvedAssets(exercise: Exercise): Exercise {
  return {
    ...exercise,
    imageUrl: resolveAssetUrl(exercise.imageUrl),
    gifUrl: resolveAssetUrl(exercise.gifUrl),
  };
}

export async function getExercises(
  filters: ExerciseFilters,
  page: number,
  size: number = EXERCISES_PAGE_SIZE,
): Promise<Page<Exercise>> {
  try {
    const { data } = await apiClient.get<Page<Exercise>>(EXERCISES_ENDPOINT, {
      params: {
        page,
        size,
        search: filters.search || undefined,
        equipment: filters.equipment || undefined,
        category: filters.category || undefined,
      },
    });
    return { ...data, content: data.content.map(withResolvedAssets) };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getExerciseById(id: string): Promise<Exercise> {
  try {
    const { data } = await apiClient.get<Exercise>(`${EXERCISES_ENDPOINT}/${id}`);
    return withResolvedAssets(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getEquipmentOptions(): Promise<string[]> {
  try {
    const { data } = await apiClient.get<string[]>(`${EXERCISES_ENDPOINT}/equipment`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getCategoryOptions(): Promise<string[]> {
  try {
    const { data } = await apiClient.get<string[]>(`${EXERCISES_ENDPOINT}/category`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
