/**
 * Duration conversion shared app-wide. The backend stores durations as whole
 * seconds; the UI displays and edits them as "MM:SS". All conversion goes
 * through these two helpers — do not duplicate the logic elsewhere.
 */

/** Backend seconds → "MM:SS" for display, e.g. 45 → "00:45", 90 → "01:30". */
export function secondsToDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * User-typed duration → backend seconds. Accepts "MM:SS" (seconds overflow
 * rolls into minutes, so "5:99" → 399) or plain digits treated as seconds
 * ("90" → 90). Blank or malformed input returns null.
 */
export function durationToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  const match = /^(\d{1,3}):(\d{1,2})$/.exec(trimmed);
  if (match) {
    return Number(match[1]) * 60 + Number(match[2]);
  }
  return /^\d{1,4}$/.test(trimmed) ? Number(trimmed) : null;
}
