import { format, parse, parseISO, isValid } from 'date-fns';

export function todayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Current local time as HH:mm (device timezone). */
export function currentLocalTime(date: Date = new Date()): string {
  return format(date, 'HH:mm');
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, 'EEE, MMM d, yyyy') : dateStr;
}

export function formatShortDate(dateStr: string): string {
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, 'MMM d') : dateStr;
}

/** e.g. Jun 1, 2026 — used in reset confirmations and toasts. */
export function formatLongDate(dateStr: string): string {
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, 'MMM d, yyyy') : dateStr;
}

export function formatDayName(dateStr: string): string {
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, 'EEE') : '';
}

/** Normalize HH:mm or HH:mm:ss to HH:mm for storage and parsing. */
export function normalizeTimeString(timeStr: string): string {
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return trimmed;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return trimmed;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** True when a stored punch time is a non-empty, parseable HH:mm value. */
export function hasValidPunchTime(timeStr: string | null | undefined): boolean {
  if (timeStr == null) return false;
  const trimmed = timeStr.trim();
  if (!trimmed) return false;
  const normalized = normalizeTimeString(trimmed);
  if (!/^\d{2}:\d{2}$/.test(normalized)) return false;
  const [h, m] = normalized.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/**
 * Combine an attendance date (yyyy-MM-dd) with a clock time (HH:mm).
 * Always anchors both values on the attendance date — never today's date.
 */
export function parseTimeOnDate(dateStr: string, timeStr: string): Date {
  const normalizedTime = normalizeTimeString(timeStr);
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = normalizedTime.match(/^(\d{2}):(\d{2})$/);

  if (dateMatch && timeMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const day = parseInt(dateMatch[3], 10);
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    return new Date(year, month, day, hours, minutes, 0, 0);
  }

  const parsed = parse(`${dateStr} ${normalizedTime}`, 'yyyy-MM-dd HH:mm', new Date(0));
  if (!isValid(parsed)) {
    throw new Error(`Invalid date/time: ${dateStr} ${timeStr}`);
  }
  return parsed;
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function minutesToHoursDecimal(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

/**
 * Format a duration in minutes as HH:MM (e.g. 510 → "08:30", 600 → "10:00").
 * Hours are not capped at 23 — suitable for daily and monthly totals.
 */
export function formatDurationHHMM(totalMinutes: number): string {
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format decimal hours (internal storage) as HH:MM for display. */
export function formatDurationFromHours(hours: number): string {
  return formatDurationHHMM(Math.round(hours * 60));
}

/** @deprecated Use formatDurationHHMM — kept as alias for existing imports. */
export function formatMinutesAsDuration(minutes: number): string {
  return formatDurationHHMM(minutes);
}

export function formatMinutesAsClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Display a clock time in 24-hour HH:mm format. */
export function formatTime24h(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format time in 12-hour AM/PM format (e.g., "02:45 PM"). */
export function formatTime12hWithAMPM(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
}

/** @deprecated Use formatTime24h */
export function formatTime12h(timeStr: string): string {
  return formatTime24h(timeStr);
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutesToTime(timeStr: string, minutes: number): string {
  return minutesToTimeString(timeToMinutes(timeStr) + minutes);
}

export function averageTimeStrings(times: string[]): string | null {
  if (times.length === 0) return null;
  const total = times.reduce((sum, t) => sum + timeToMinutes(t), 0);
  return minutesToTimeString(Math.round(total / times.length));
}

export function monthStart(date: Date): string {
  return format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd');
}

export function monthEnd(date: Date): string {
  return format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd');
}

export function previousMonthRange(ref: Date = new Date()): { start: string; end: string } {
  const d = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  return { start: monthStart(d), end: monthEnd(d) };
}

export function currentMonthRange(ref: Date = new Date()): { start: string; end: string } {
  return { start: monthStart(ref), end: monthEnd(ref) };
}
