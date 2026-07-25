/**
 * Date helpers for the readings pages.
 *
 * Everything is computed in America/Los_Angeles because the backend's liturgical day
 * rolls over on Pacific time. Doing it in UTC drifts the "previous/next day" links by a
 * day for anyone browsing in the evening Pacific.
 */

const PACIFIC = "America/Los_Angeles";

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PACIFIC,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in Pacific time, as YYYY-MM-DD. */
export function getTodayInPacific(): string {
  return isoFormatter.format(new Date());
}

/** Shift a YYYY-MM-DD slug by *days*, staying in Pacific time. */
export function shiftDate(dateStr: string, days: number): string {
  // Midday anchor so a DST transition cannot push the result into the adjacent day.
  const d = new Date(`${dateStr}T12:00:00-07:00`);
  d.setDate(d.getDate() + days);
  return isoFormatter.format(d);
}

/** True when *value* is a well-formed YYYY-MM-DD calendar date. */
export function isValidDateSlug(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
