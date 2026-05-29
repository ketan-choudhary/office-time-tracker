export type RecordStatus = 'complete' | 'partial' | 'draft';

export interface AttendanceRecord {
  id: string;
  date: string;
  wfh1Start: string;
  wfh1End: string;
  punchIn: string;
  punchOut: string;
  wfh2Start: string;
  wfh2End: string;
  officeHours: number;
  wfhHours: number;
  totalHours: number;
  status: RecordStatus;
}

export interface AppSettings {
  id: 'settings';
  targetHoursMinutes: number;
  officeDaysRequiredPerMonth: number;
  officialStartTime: string;
  gapBeforeOfficeMinutes: number;
  gapAfterOfficeMinutes: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  targetHoursMinutes: 9 * 60 + 15,
  officeDaysRequiredPerMonth: 10,
  officialStartTime: '09:00',
  gapBeforeOfficeMinutes: 30,
  gapAfterOfficeMinutes: 30,
};

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ComputedTimes {
  wfh1Start: string;
  wfh1End: string;
  wfh2Start: string;
  wfh2End: string;
  officeHours: number;
  wfhHours: number;
  totalHours: number;
}
