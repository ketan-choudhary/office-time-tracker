import type { AppSettings, AttendanceRecord } from '@/types';
import { resolveDayType } from './recordHelpers';
import {
  currentLocalTime,
  formatTime24h,
  minutesBetween,
  parseTimeOnDate,
} from './time';

/** Infosys-style minimum office presence target (3h 30m). */
export const OFFICE_HOURS_TARGET_MINUTES = 3 * 60 + 30;

/** @deprecated Use DisplayStatus */
export type DayStatus = DisplayStatus;

export type DisplayStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'WFH'
  | 'Leave'
  | 'Holiday';

export interface ProgressOptions {
  live?: boolean;
}

export interface TimelineStep {
  label: string;
  time: string | null;
  kind: 'wfh' | 'office' | 'default';
}

export interface DayProgress {
  currentMinutes: number;
  targetMinutes: number;
  percent: number;
}

export function getDayStatus(record?: AttendanceRecord | null): DayStatus {
  return getDisplayStatus(record);
}

export function getDisplayStatus(record?: AttendanceRecord | null): DisplayStatus {
  if (!record) return 'Not Started';
  const dayType = resolveDayType(record);
  if (dayType === 'WFH') return 'WFH';
  if (dayType === 'LEAVE') return 'Leave';
  if (dayType === 'HOLIDAY') return 'Holiday';
  if (!record.punchIn) return 'Not Started';
  if (record.status === 'complete' && record.punchOut) return 'Completed';
  return 'In Progress';
}

export function formatTimeLabel(time: string | null | undefined): string {
  return time ? formatTime24h(time) : '—';
}

export function buildTimeline(
  record: AttendanceRecord | null | undefined,
  settings: AppSettings,
): TimelineStep[] {
  const officialStart = settings.officialStartTime;

  if (!record?.punchIn) {
    return [
      { label: 'WFH1 Start', time: officialStart, kind: 'wfh' },
      { label: 'WFH1 End', time: null, kind: 'wfh' },
      { label: 'Punch In', time: null, kind: 'office' },
      { label: 'Punch Out', time: null, kind: 'office' },
      { label: 'WFH2 Start', time: null, kind: 'wfh' },
      { label: 'WFH2 End', time: null, kind: 'wfh' },
    ];
  }

  if (record.status !== 'complete' || !record.punchOut) {
    return [
      { label: 'WFH1 Start', time: record.wfh1Start || officialStart, kind: 'wfh' },
      { label: 'WFH1 End', time: record.wfh1End || null, kind: 'wfh' },
      { label: 'Punch In', time: record.punchIn, kind: 'office' },
      { label: 'Punch Out', time: null, kind: 'office' },
      { label: 'WFH2 Start', time: null, kind: 'wfh' },
      { label: 'WFH2 End', time: null, kind: 'wfh' },
    ];
  }

  return [
    { label: 'WFH1 Start', time: record.wfh1Start, kind: 'wfh' },
    { label: 'WFH1 End', time: record.wfh1End, kind: 'wfh' },
    { label: 'Punch In', time: record.punchIn, kind: 'office' },
    { label: 'Punch Out', time: record.punchOut, kind: 'office' },
    { label: 'WFH2 Start', time: record.wfh2Start, kind: 'wfh' },
    { label: 'WFH2 End', time: record.wfh2End, kind: 'wfh' },
  ];
}

export function getDayProgress(
  record: AttendanceRecord | null | undefined,
  settings: AppSettings,
  options?: ProgressOptions,
): DayProgress {
  const targetMinutes = settings.targetHoursMinutes;
  const live = options?.live ?? false;

  if (record?.dayType === 'WFH' && record.status === 'complete') {
    const currentMinutes = Math.round((record.wfhHours || record.totalHours) * 60);
    const percent =
      targetMinutes > 0 ? Math.min(100, Math.round((currentMinutes / targetMinutes) * 100)) : 0;
    return { currentMinutes, targetMinutes, percent };
  }

  if (!record?.punchIn) {
    return { currentMinutes: 0, targetMinutes, percent: 0 };
  }

  if (record.status === 'complete' && record.punchOut) {
    const currentMinutes = Math.round(record.totalHours * 60);
    const percent =
      targetMinutes > 0 ? Math.min(100, Math.round((currentMinutes / targetMinutes) * 100)) : 0;
    return { currentMinutes, targetMinutes, percent };
  }

  if (!live) {
    const currentMinutes = Math.round(record.totalHours * 60);
    const percent =
      targetMinutes > 0 ? Math.min(100, Math.round((currentMinutes / targetMinutes) * 100)) : 0;
    return { currentMinutes, targetMinutes, percent };
  }

  const date = record.date;
  const punchInDate = parseTimeOnDate(date, record.punchIn);
  const nowTime = currentLocalTime();
  const nowOnDate = parseTimeOnDate(date, nowTime);
  const officeMinutes =
    nowOnDate > punchInDate ? minutesBetween(punchInDate, nowOnDate) : 0;
  const wfh1Start = record.wfh1Start || settings.officialStartTime;
  const wfh1End = record.wfh1End;
  const wfh1Minutes =
    wfh1End && wfh1Start
      ? Math.max(0, minutesBetween(parseTimeOnDate(date, wfh1Start), parseTimeOnDate(date, wfh1End)))
      : Math.round(record.wfhHours * 60);
  const currentMinutes = wfh1Minutes + officeMinutes;
  const percent =
    targetMinutes > 0 ? Math.min(100, Math.round((currentMinutes / targetMinutes) * 100)) : 0;

  return { currentMinutes, targetMinutes, percent };
}

export function getOfficeHoursProgress(
  record: AttendanceRecord | null | undefined,
  options?: ProgressOptions,
): DayProgress {
  const targetMinutes = OFFICE_HOURS_TARGET_MINUTES;
  const live = options?.live ?? false;

  if (!record?.punchIn) {
    return { currentMinutes: 0, targetMinutes, percent: 0 };
  }

  if (record.status === 'complete' && record.punchOut) {
    const currentMinutes = Math.round(record.officeHours * 60);
    const percent =
      targetMinutes > 0 ? Math.round((currentMinutes / targetMinutes) * 100) : 0;
    return { currentMinutes, targetMinutes, percent };
  }

  if (!live) {
    const currentMinutes = Math.round(record.officeHours * 60);
    const percent =
      targetMinutes > 0 ? Math.round((currentMinutes / targetMinutes) * 100) : 0;
    return { currentMinutes, targetMinutes, percent };
  }

  const date = record.date;
  const punchInDate = parseTimeOnDate(date, record.punchIn);
  const nowOnDate = parseTimeOnDate(date, currentLocalTime());
  const officeMinutes =
    nowOnDate > punchInDate ? minutesBetween(punchInDate, nowOnDate) : 0;
  const percent =
    targetMinutes > 0 ? Math.round((officeMinutes / targetMinutes) * 100) : 0;

  return { currentMinutes: officeMinutes, targetMinutes, percent };
}

/** Ring stroke / text color for office-hours progress (0–40% red → 100%+ green). */
export function getOfficeHoursProgressColor(percent: number): string {
  if (percent >= 100) return 'text-success';
  if (percent >= 80) return 'text-[#84cc16]';
  if (percent >= 40) return 'text-warning';
  return 'text-danger';
}
