/**
 * Rest-timer domain helpers. A rest is stored as a number of seconds, with
 * `null` meaning the timer is off. Options run from off through 5-minute rests
 * in 5-second steps, matching the wheel picker's granularity.
 */

/** `null` (off) followed by 5s → 5min in 5s increments. */
export const REST_TIMER_OPTIONS: ReadonlyArray<number | null> = [
  null,
  ...Array.from({ length: 60 }, (_, index) => (index + 1) * 5),
];

/** Compact label for a rest duration, e.g. "OFF", "45s", "1min", "2min 30s". */
export function formatRestTimer(seconds: number | null): string {
  if (seconds == null || seconds <= 0) {
    return 'OFF';
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes}min` : `${minutes}min ${remainder}s`;
}

/** Lowercase variant used inside the wheel picker ("off", "45s", "1min 30s"). */
export function formatRestOption(seconds: number | null): string {
  return seconds == null || seconds <= 0 ? 'off' : formatRestTimer(seconds);
}
