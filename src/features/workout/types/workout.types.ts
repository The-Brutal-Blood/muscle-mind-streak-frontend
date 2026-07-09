/**
 * Workout domain models. UI-first for now; when the routines API lands these
 * become the response contracts (ids from the backend, exercises expanded to
 * full objects as needed).
 */

import type { Exercise } from '@/features/exercises/types/exercise.types';

export interface Routine {
  id: string;
  name: string;
  /** Display names of the routine's exercises, in order. */
  exercises: string[];
}

/** One planned set within a routine's exercise. Values are free-text while editing. */
export interface RoutineSetDraft {
  id: string;
  /** Target weight as typed by the user; empty until entered. */
  kg: string;
  /** Target repetitions as typed by the user; empty until entered. */
  reps: string;
}

/** An exercise as configured inside a routine draft: notes, rest, and sets. */
export interface RoutineExerciseDraft {
  exercise: Exercise;
  notes: string;
  /** Rest between sets, in seconds; `null` means the timer is off. */
  restSeconds: number | null;
  sets: RoutineSetDraft[];
}
