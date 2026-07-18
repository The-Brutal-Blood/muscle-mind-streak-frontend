import { useMutation } from '@tanstack/react-query';

import type { ApiError } from '@/api/client';

import {
  discardWorkoutSession,
  finishWorkoutSession,
  startEmptyWorkoutSession,
  startWorkoutSession,
} from '../services/workoutSession.service';
import type {
  FinishWorkoutRequest,
  FinishWorkoutResponse,
  WorkoutSession,
} from '../types/workout.types';

/** Starts a session from a routine (POST /workout-sessions). */
export function useStartWorkoutSession() {
  return useMutation<WorkoutSession, ApiError, string>({
    mutationFn: startWorkoutSession,
  });
}

/** Starts a blank session with no routine (POST /workout-sessions, empty body). */
export function useStartEmptyWorkoutSession() {
  return useMutation<WorkoutSession, ApiError, void>({
    mutationFn: startEmptyWorkoutSession,
  });
}

/** Finishes a session with the locally-logged results. */
export function useFinishWorkoutSession() {
  return useMutation<
    FinishWorkoutResponse | null,
    ApiError,
    { sessionId: string; payload: FinishWorkoutRequest }
  >({
    mutationFn: ({ sessionId, payload }) => finishWorkoutSession(sessionId, payload),
  });
}

/** Discards an in-progress session. */
export function useDiscardWorkoutSession() {
  return useMutation<void, ApiError, string>({
    mutationFn: discardWorkoutSession,
  });
}
