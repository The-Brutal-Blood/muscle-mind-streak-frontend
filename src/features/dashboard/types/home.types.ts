import type { TrackingType } from '@/features/workout/types/workout.types';

/**
 * Home tab domain models — the GET /home response contract.
 *
 * Sections that a brand-new user has no data for (`weeklyGoal`, `recentWorkout`,
 * `stats`) are nullable so the screen can hide them, and `todayWorkouts` is
 * empty on a rest day / when nothing is scheduled.
 */

export interface HomeGreeting {
  title: string;
  message: string;
}

export interface HomeTodayWorkout {
  routineId: string;
  routineName: string;
  exerciseCount: number;
  estimatedDurationMinutes: number;
  /** Whether this scheduled routine has already been finished today. */
  completedToday: boolean;
}

export interface HomeWeeklyGoal {
  completed: number;
  target: number;
}

export interface HomeRecentWorkout {
  routineName: string;
  /** ISO timestamp of when the workout finished. */
  completedAt: string;
  durationMinutes: number;
  volume: number;
}

export interface HomeStats {
  totalWorkouts: number;
  totalDurationMinutes: number;
  totalVolume: number;
}

export interface HomePersonalRecord {
  exerciseName: string;
  weight: number;
}

/** One recently-broken PR in the Home "Personal Records" section. */
export interface HomeRecentPersonalRecord {
  exerciseId: string;
  exerciseName: string;
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

/** GET /home — everything the Home tab renders in one payload. */
export interface HomeSummary {
  greeting: HomeGreeting;
  userName: string;
  streak: number;
  /** Every routine scheduled today; empty on a rest day or when nothing is scheduled. */
  todayWorkouts: HomeTodayWorkout[];
  isRestDay: boolean;
  /** Null until the user has any tracked history. */
  weeklyGoal: HomeWeeklyGoal | null;
  recentWorkout: HomeRecentWorkout | null;
  stats: HomeStats | null;
  /** Most recent personal best; null until the user sets one. */
  latestPersonalRecord: HomePersonalRecord | null;
  /** Latest broken PRs, newest first; absent/empty until the user sets one. */
  recentPersonalRecords?: HomeRecentPersonalRecord[];
  /** True when the backend wants the user prompted to log today's body weight. */
  shouldLogWeight: boolean;
}
