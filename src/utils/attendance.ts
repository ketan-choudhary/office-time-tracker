import type { AppSettings, AttendanceRecord } from '@/types';
import { currentLocalTime, formatTime12h, minutesBetween, parseTimeOnDate } from './time';

export type DayStatus = 'Not Started' | 'Working' | 'Completed';

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
  if (!record?.punchIn) return 'Not Started';
  if (record.status === 'complete' && record.punchOut) return 'Completed';
  return 'Working';
}

export function formatTimeLabel(time: string | null | undefined): string {
  return time ? formatTime12h(time) : '—';
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
): DayProgress {
  const targetMinutes = settings.targetHoursMinutes;

  if (!record?.punchIn) {
    return { currentMinutes: 0, targetMinutes, percent: 0 };
  }

  if (record.status === 'complete' && record.punchOut) {
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
