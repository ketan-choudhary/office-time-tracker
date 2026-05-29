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

export function formatDayName(dateStr: string): string {
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, 'EEE') : '';
}

export function parseTimeOnDate(dateStr: string, timeStr: string): Date {
  return parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function minutesToHoursDecimal(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

export function formatMinutesAsDuration(minutes: number): string {
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatMinutesAsClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime12h(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
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
