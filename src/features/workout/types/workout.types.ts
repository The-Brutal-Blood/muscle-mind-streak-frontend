/**
 * Workout domain models. UI-first for now; when the routines API lands these
 * become the response contracts (ids from the backend, exercises expanded to
 * full objects as needed).
 */

/**
 * How an exercise is tracked. The backend is the source of truth — the
 * frontend never infers this.
 */
export type TrackingType = 'WEIGHT_REPS' | 'TIME';

/**
 * The exercise identity the routine editor needs. A full library `Exercise`
 * satisfies it structurally; a saved routine supplies just these fields.
 */
export interface RoutineDraftExercise {
  id: string;
  name: string;
  imageUrl: string;
}

/** One planned set within a routine's exercise. Values are free-text while editing. */
export interface RoutineSetDraft {
  id: string;
  /** Target weight as typed by the user; empty until entered. */
  kg: string;
  /** Target repetitions as typed by the user; empty until entered. */
  reps: string;
  /** TIME tracking: duration as typed ("MM:SS"); sent as seconds on save. */
  duration?: string;
}

/** An exercise as configured inside a routine draft: notes, rest, and sets. */
export interface RoutineExerciseDraft {
  exercise: RoutineDraftExercise;
  notes: string;
  /** Rest between sets, in seconds; `null` means the timer is off. */
  restSeconds: number | null;
  sets: RoutineSetDraft[];
  /** How this exercise is tracked; the Timer Mode switch flips it. */
  trackingType: TrackingType;
}

/**
 * A day of the week a routine can be scheduled for. Full names keep the value
 * self-describing for the backend contract (wired to the API later).
 */
export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/** Payload contracts for POST /routines. */
export interface CreateRoutineSetInput {
  setNumber: number;
  /** WEIGHT_REPS tracking only; null for TIME sets. */
  weight: number | null;
  /** WEIGHT_REPS tracking only; null for TIME sets. */
  reps: number | null;
  /** TIME tracking only, in seconds; null for WEIGHT_REPS sets. */
  duration: number | null;
}

export interface CreateRoutineExerciseInput {
  exerciseId: string;
  displayOrder: number;
  trackingType: TrackingType;
  /** Omitted when the rest timer is off. */
  restTimerSeconds?: number;
  /** Omitted when the user left notes blank. */
  notes?: string;
  sets: CreateRoutineSetInput[];
}

export interface CreateRoutineRequest {
  name: string;
  /** Weekdays the routine is scheduled for; pending backend support. */
  scheduledDays?: Weekday[];
  exercises: CreateRoutineExerciseInput[];
}

/** One row from GET /routines/routine-list — id, name, and exercise display names. */
export interface RoutineOverview {
  routineId: string;
  name: string;
  exercises: string[];
  /** Weekdays the routine is scheduled for; may be absent/empty. */
  scheduledDays?: Weekday[];
}

/** Full routine detail from GET /routines/:id (also the PUT response shape). */
export interface RoutineDetailSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  /** TIME tracking, in seconds; null/absent for WEIGHT_REPS sets. */
  duration?: number | null;
}

export interface RoutineDetailExercise {
  routineExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  imageUrl: string;
  displayOrder: number;
  trackingType?: TrackingType;
  restTimerSeconds?: number | null;
  notes?: string | null;
  sets: RoutineDetailSet[];
}

export interface RoutineDetail {
  routineId: string;
  name: string;
  createdAt: string;
  /** Weekdays the routine is scheduled for; pending backend support. */
  scheduledDays?: Weekday[];
  exercises: RoutineDetailExercise[];
}

/* ------------------------------------------------------------------ *
 * Workout session (live logging) — POST /workout-sessions            *
 * ------------------------------------------------------------------ */

/**
 * A prior performance for a set, shown read-only in the PREVIOUS column.
 * Shape shared by POST /workout-sessions (`previousSets`) and
 * GET /exercises/:id/history/latest (`sets`).
 */
export interface WorkoutPreviousSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  /** TIME tracking, in seconds; null/absent for WEIGHT_REPS sets. */
  duration?: number | null;
}

export interface WorkoutServerSet {
  workoutSetId: string;
  setNumber: number;
  targetWeight: number | null;
  targetReps: number | null;
  /** TIME tracking target, in seconds. */
  targetDuration?: number | null;
  actualWeight: number | null;
  actualReps: number | null;
  /** TIME tracking actual, in seconds. */
  duration?: number | null;
  completed: boolean;
}

export interface WorkoutServerExercise {
  workoutExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  imageUrl: string;
  displayOrder: number;
  trackingType?: TrackingType;
  restTimerSeconds: number | null;
  notes: string;
  previousSets: WorkoutPreviousSet[];
  sets: WorkoutServerSet[];
}

/** POST /workout-sessions response — the started session. */
export interface WorkoutSession {
  sessionId: string;
  routineId: string;
  routineName: string;
  status: string;
  startedAt: string;
  durationSeconds: number;
  totalVolume: number;
  completedSets: number;
  exercises: WorkoutServerExercise[];
}

/** Locally-editable set (weight/reps are free text while logging). */
export interface WorkoutSetState {
  workoutSetId: string;
  setNumber: number;
  targetWeight: number | null;
  targetReps: number | null;
  weight: string;
  reps: string;
  completed: boolean;
  /**
   * Weight/reps were copied from the previous set by "Add Set" and not yet
   * touched by the user — rendered dimmed, like a placeholder. Cleared on
   * edit or completion.
   */
  prefilled?: boolean;
  /**
   * TIME tracking: duration as typed/displayed ("MM:SS"); converted to
   * seconds for the finish payload.
   */
  duration?: string;
}

export interface WorkoutExerciseState {
  workoutExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  imageUrl: string;
  restTimerSeconds: number | null;
  notes: string;
  previousSets: WorkoutPreviousSet[];
  sets: WorkoutSetState[];
  /**
   * How this exercise is tracked. Seeded from the backend on session start;
   * the Timer Mode switch flips it. Absent on sessions persisted before this
   * field existed — treat as WEIGHT_REPS.
   */
  trackingType?: TrackingType;
}

/** The whole in-progress session held in local state and persisted for resume. */
export interface WorkoutSessionState {
  sessionId: string;
  routineId: string;
  routineName: string;
  startedAt: string;
  exercises: WorkoutExerciseState[];
}

/** POST /workout-sessions/:id/finish payload. */
export interface FinishWorkoutSetInput {
  /** `null` for sets added mid-session; the backend assigns a UUID. */
  workoutSetId: string | null;
  /** WEIGHT_REPS tracking only; null for TIME sets. */
  actualWeight: number | null;
  /** WEIGHT_REPS tracking only; null for TIME sets. */
  actualReps: number | null;
  /** TIME tracking only, in seconds; null for WEIGHT_REPS sets. */
  duration: number | null;
  completed: boolean;
}

export interface FinishWorkoutExerciseInput {
  /** `null` for exercises added mid-session; the backend assigns a UUID. */
  workoutExerciseId: string | null;
  /**
   * Library exercise id. Sent only for exercises added mid-session (when
   * `workoutExerciseId` is null) so the backend can create the WorkoutExercise;
   * omitted for exercises the session already owns.
   */
  exerciseId?: string;
  /**
   * Sent only for exercises added mid-session (with `exerciseId`) so the
   * backend stores how the new exercise is tracked.
   */
  trackingType?: TrackingType;
  notes: string;
  sets: FinishWorkoutSetInput[];
}

export interface FinishWorkoutRequest {
  durationSeconds: number;
  totalVolume: number;
  completedSets: number;
  exercises: FinishWorkoutExerciseInput[];
}
