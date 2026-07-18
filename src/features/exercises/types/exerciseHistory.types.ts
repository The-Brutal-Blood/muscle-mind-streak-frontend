import type { TrackingType } from '@/features/workout/types/workout.types';

/**
 * Exercise history domain models — the GET /exercises/:id/history response
 * contract. One request returns everything the History tab renders: the last
 * performance, a strength-progress series, aggregate statistics, and the full
 * per-workout log (newest first).
 */

/** A completed set within a performance, read-only in the History tab. */
export interface ExerciseHistorySet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  /** TIME tracking, in seconds; null/absent for WEIGHT_REPS sets. */
  duration?: number | null;
}

/** The most recent time the exercise was performed. Null when never logged. */
export interface ExerciseLastPerformance {
  /** ISO timestamp of the workout. */
  performedAt: string;
  routineName: string;
  volume: number;
  sets: ExerciseHistorySet[];
}

/**
 * One point on the strength-progress series. `maxWeight` is null for workouts
 * where no weight was recorded; those points are dropped before charting.
 */
export interface ExerciseProgressPoint {
  /** "YYYY-MM-DD". */
  date: string;
  maxWeight: number | null;
}

/** Aggregate statistics across every logged performance. */
export interface ExerciseHistoryStatistics {
  timesPerformed: number;
  totalSets: number;
  totalVolume: number;
  averageWeight: number;
  averageReps: number;
  bestVolume: number;
  /** ISO timestamp. */
  firstPerformedAt: string;
  /** ISO timestamp. */
  lastPerformedAt: string;
}

/** One completed workout that included this exercise. */
export interface ExerciseHistoryWorkout {
  workoutSessionId: string;
  routineName: string;
  /** ISO timestamp of when the workout finished. */
  performedAt: string;
  durationMinutes: number;
  volume: number;
  /** May be empty when no per-set detail was captured. */
  sets: ExerciseHistorySet[];
}

/**
 * GET /exercises/:id/history/latest response — the user's most recent
 * completed performance. A never-performed exercise still returns 200 with
 * `performedAt: null` and an empty `sets` array.
 */
export interface ExerciseLatestHistory {
  exerciseId: string;
  trackingType?: TrackingType;
  /** ISO timestamp; null when the exercise has never been performed. */
  performedAt: string | null;
  sets: ExerciseHistorySet[];
}

/** The user's all-time best for this exercise. */
export interface ExercisePersonalRecord {
  trackingType?: TrackingType;
  /** WEIGHT_REPS tracking; null for TIME PRs. */
  weight: number | null;
  /** WEIGHT_REPS tracking; null for TIME PRs. */
  reps: number | null;
  /** TIME tracking, in seconds; null for weight PRs. */
  duration: number | null;
  /** ISO timestamp of when the record was set. */
  achievedAt: string;
}

/** Full GET /exercises/:id/history response. */
export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  /** How this exercise is tracked; the backend is the source of truth. */
  trackingType?: TrackingType;
  /** All-time best; null when the exercise has never been performed. */
  personalRecord?: ExercisePersonalRecord | null;
  /** Null when the exercise has never been performed. */
  lastPerformance: ExerciseLastPerformance | null;
  progress: ExerciseProgressPoint[];
  statistics: ExerciseHistoryStatistics;
  history: ExerciseHistoryWorkout[];
}
