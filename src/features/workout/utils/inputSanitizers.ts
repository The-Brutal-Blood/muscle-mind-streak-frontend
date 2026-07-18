import { durationToSeconds, secondsToDuration } from '@/utils/duration';

/**
 * Keystroke sanitizers for the set-logging inputs, shared by the live workout
 * session and the routine editor. keyboardType alone doesn't block letters
 * from paste or external keyboards.
 */

/** Digits plus at most one decimal point (weights, e.g. "22.5"). */
export function sanitizeWeight(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) {
    return cleaned;
  }
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

/** Whole numbers only (reps). */
export function sanitizeReps(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/**
 * Formats duration keystrokes as MM:SS, calculator-style: digits fill from
 * the right, so "5" → "5", "56" → "56", "5612" → "56:12".
 */
export function sanitizeDuration(value: string): string {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
}

/**
 * Normalizes a duration when the field loses focus: seconds overflow rolls
 * into minutes and the result is zero-padded MM:SS ("90" → "01:30",
 * "5:99" → "06:39"). Blank or zero input clears the field.
 */
export function normalizeDuration(value: string): string {
  const seconds = durationToSeconds(value);
  if (seconds == null || seconds <= 0) {
    return '';
  }
  return secondsToDuration(seconds);
}
