import type { TrackingType } from '@/features/workout/types/workout.types';

/**
 * Workout history domain models — the GET /workout-history response contract
 * (a Spring `Page`). Every workout arrives fully expanded (exercises + sets),
 * so the screen needs no follow-up requests.
 */

export interface WorkoutHistorySet {
  setNumber: number;
  /** Null when the set was saved without a weight. */
  weight: number | null;
  /** Null when the set was saved without reps. */
  reps: number | null;
  /** TIME tracking, in seconds; null/absent for WEIGHT_REPS sets. */
  duration?: number | null;
  completed: boolean;
  volume: number;
}

export interface WorkoutHistoryExercise {
  exerciseId: string;
  exerciseName: string;
  imageUrl: string;
  /** How this exercise is tracked; the backend is the source of truth. */
  trackingType?: TrackingType;
  notes: string;
  restTimerSeconds?: number;
  completedSets: number;
  sets: WorkoutHistorySet[];
}

export interface WorkoutHistoryItem {
  workoutSessionId: string;
  routineName: string;
  /** ISO timestamp of when the workout finished. */
  completedAt: string;
  durationMinutes: number;
  totalVolume: number;
  exerciseCount: number;
  completedSetCount: number;
  personalRecordsBroken: number;
  exercises: WorkoutHistoryExercise[];
}

/** Paged GET /workout-history response (only the fields the UI consumes). */
export interface WorkoutHistoryPage {
  content: WorkoutHistoryItem[];
  totalElements: number;
  totalPages: number;
  /** Zero-based page index. */
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
