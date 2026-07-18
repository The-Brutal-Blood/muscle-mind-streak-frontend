import { durationToSeconds } from '@/utils/duration';

import { sortWeekdays } from './weekdays';
import type {
  CreateRoutineExerciseInput,
  CreateRoutineRequest,
  CreateRoutineSetInput,
  RoutineExerciseDraft,
  Weekday,
} from '../types/workout.types';

/** Parses a free-text numeric field; blank or non-numeric returns null. */
function parseNumericField(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Maps a draft's sets onto the request shape for its tracking type: TIME sets
 * carry a duration (weight/reps null); WEIGHT_REPS sets carry weight/reps
 * (duration null). Empty rows are dropped and survivors renumbered.
 */
function buildSets(entry: RoutineExerciseDraft): CreateRoutineSetInput[] {
  if (entry.trackingType === 'TIME') {
    return entry.sets
      .map(set => durationToSeconds(set.duration ?? ''))
      .filter((duration): duration is number => duration != null && duration > 0)
      .map((duration, setIndex) => ({
        setNumber: setIndex + 1,
        weight: null,
        reps: null,
        duration,
      }));
  }
  return entry.sets
    .map(set => ({ weight: parseNumericField(set.kg), reps: parseNumericField(set.reps) }))
    .filter(set => set.weight !== null || set.reps !== null)
    .map((set, setIndex) => ({
      setNumber: setIndex + 1,
      weight: set.weight ?? 0,
      reps: set.reps ?? 0,
      duration: null,
    }));
}

/**
 * Maps the routine editor's draft onto the POST /routines request. Sets with
 * no values entered are dropped, and the survivors are renumbered
 * sequentially. Rest timer and notes are omitted when unset/blank. Scheduled
 * days are always sent (an empty array when none are selected), in week order.
 */
export function buildCreateRoutinePayload(
  name: string,
  entries: RoutineExerciseDraft[],
  scheduledDays: readonly Weekday[] = [],
): CreateRoutineRequest {
  return {
    name: name.trim(),
    scheduledDays: sortWeekdays(scheduledDays),
    exercises: entries.map((entry, index) => {
      const exercise: CreateRoutineExerciseInput = {
        exerciseId: entry.exercise.id,
        displayOrder: index + 1,
        trackingType: entry.trackingType,
        sets: buildSets(entry),
      };

      if (entry.restSeconds != null) {
        exercise.restTimerSeconds = entry.restSeconds;
      }
      const notes = entry.notes.trim();
      if (notes) {
        exercise.notes = notes;
      }
      return exercise;
    }),
  };
}
