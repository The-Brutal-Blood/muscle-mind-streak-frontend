import type { TrackingType } from '@/features/workout/types/workout.types';

import { secondsToDuration } from './duration';

/**
 * Shared formatting for personal-record values across the Home dashboard,
 * achievement banner, and Exercise Detail summary. Weight PRs render as
 * "100 kg × 5"; TIME PRs render as "02:30".
 */

/** The value fields every PR payload carries, regardless of endpoint. */
export interface PersonalRecordValue {
  trackingType?: TrackingType | null;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
}

/** Drops float noise from a weight: 30 → "30", 22.5 → "22.5". */
function trimWeight(weight: number): string {
  return String(Math.round(weight * 100) / 100);
}

/** "100 kg × 5" for weight PRs, "02:30" for TIME PRs, "-" when valueless. */
export function formatPersonalRecordValue(value: PersonalRecordValue): string {
  if (value.trackingType === 'TIME') {
    return value.duration != null ? secondsToDuration(value.duration) : '-';
  }
  if (value.weight == null) {
    return '-';
  }
  const weight = `${trimWeight(value.weight)} kg`;
  return value.reps != null ? `${weight} × ${value.reps}` : weight;
}
