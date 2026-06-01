import type { AppSettings, AttendanceRecord, ComputedTimes } from '@/types';
import { resolveDayType } from './recordHelpers';
import { minutesBetween, parseTimeOnDate, hasValidPunchTime } from './time';

/** Schedule after punch in only (before punch out). */
export function computePunchInOnly(
  date: string,
  punchIn: string,
  settings: AppSettings,
): Pick<
  ComputedTimes,
  'wfh1Start' | 'wfh1End' | 'wfh2Start' | 'wfh2End' | 'officeHours' | 'wfhHours' | 'totalHours'
> {
  const wfh1Start = settings.officialStartTime;
  const wfh1EndDate = new Date(
    parseTimeOnDate(date, punchIn).getTime() - settings.gapBeforeOfficeMinutes * 60000,
  );
  const wfh1End = formatTimeFromDate(wfh1EndDate);
  const wfh1Minutes = Math.max(0, minutesBetween(parseTimeOnDate(date, wfh1Start), wfh1EndDate));

  return {
    wfh1Start,
    wfh1End,
    wfh2Start: '',
    wfh2End: '',
    officeHours: 0,
    wfhHours: wfh1Minutes / 60,
    totalHours: wfh1Minutes / 60,
  };
}

export function computeAttendance(
  date: string,
  punchIn: string,
  punchOut: string,
  settings: AppSettings,
): ComputedTimes {
  if (!hasValidPunchTime(punchIn)) {
    throw new Error('Punch in time is required.');
  }
  if (!hasValidPunchTime(punchOut)) {
    throw new Error('Punch out time is required.');
  }

  const punchInDate = parseTimeOnDate(date, punchIn);
  const punchOutDate = parseTimeOnDate(date, punchOut);

  console.log('[computeAttendance] punch time comparison', {
    selectedDate: date,
    punchIn,
    punchOut,
    punchInDateTime: punchInDate.toISOString(),
    punchOutDateTime: punchOutDate.toISOString(),
    punchInValid: !Number.isNaN(punchInDate.getTime()),
    punchOutValid: !Number.isNaN(punchOutDate.getTime()),
  });

  if (Number.isNaN(punchInDate.getTime()) || Number.isNaN(punchOutDate.getTime())) {
    throw new Error('Invalid punch time.');
  }

  if (punchOutDate <= punchInDate) {
    throw new Error('Punch out must be after punch in.');
  }

  const wfh1Start = settings.officialStartTime;
  const wfh1EndDate = new Date(
    parseTimeOnDate(date, punchIn).getTime() - settings.gapBeforeOfficeMinutes * 60000,
  );
  const wfh1End = formatTimeFromDate(wfh1EndDate);

  const officeMinutes = minutesBetween(punchInDate, punchOutDate);

  const wfh1StartDate = parseTimeOnDate(date, wfh1Start);
  const wfh1Minutes = Math.max(0, minutesBetween(wfh1StartDate, wfh1EndDate));

  const wfh2StartDate = new Date(
    punchOutDate.getTime() + settings.gapAfterOfficeMinutes * 60000,
  );
  const wfh2Start = formatTimeFromDate(wfh2StartDate);

  const wfh2Minutes = Math.max(
    0,
    settings.targetHoursMinutes - officeMinutes - wfh1Minutes,
  );

  const wfh2EndDate = new Date(wfh2StartDate.getTime() + wfh2Minutes * 60000);
  const wfh2End = formatTimeFromDate(wfh2EndDate);

  const wfhMinutes = wfh1Minutes + wfh2Minutes;
  const totalMinutes = officeMinutes + wfhMinutes;

  return {
    wfh1Start,
    wfh1End,
    wfh2Start,
    wfh2End,
    officeHours: officeMinutes / 60,
    wfhHours: wfhMinutes / 60,
    totalHours: totalMinutes / 60,
  };
}

function formatTimeFromDate(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isOfficeDay(record: AttendanceRecord): boolean {
  if (resolveDayType(record) !== 'OFFICE') return false;
  return (
    record.status === 'complete' &&
    Boolean(record.punchIn) &&
    Boolean(record.punchOut)
  );
}

export function parseDurationInput(value: string): number {
  const trimmed = value.trim().toLowerCase();
  const hMatch = trimmed.match(/(\d+)\s*h/);
  const mMatch = trimmed.match(/(\d+)\s*m/);
  const colonMatch = trimmed.match(/^(\d+):(\d+)$/);

  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }

  let minutes = 0;
  if (hMatch) minutes += parseInt(hMatch[1], 10) * 60;
  if (mMatch) minutes += parseInt(mMatch[1], 10);
  if (!hMatch && !mMatch) {
    const num = parseFloat(trimmed);
    if (!Number.isNaN(num)) minutes = Math.round(num * 60);
  }
  return minutes;
}

export function formatDurationInput(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
