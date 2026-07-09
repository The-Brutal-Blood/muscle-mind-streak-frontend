/** Contracts for the exercise library endpoints (/exercises). */

export interface Exercise {
  id: string;
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  target: string;
  primaryMuscle: string;
  secondaryMuscle: string[];
  instructions: string;
  instructionSteps: string[];
  imageUrl: string;
  gifUrl: string;
}

/** The Spring `Page<T>` fields the app consumes. */
export interface Page<T> {
  content: T[];
  /** Zero-based page index. */
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * Server-side filters for GET /exercises. All optional and freely
 * combinable; `search` is free-text across name/category/equipment/muscles,
 * the rest are exact (case-insensitive) matches.
 */
export interface ExerciseFilters {
  search?: string;
  equipment?: string;
  category?: string;
}
