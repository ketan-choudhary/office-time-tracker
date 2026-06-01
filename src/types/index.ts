export type RecordStatus = 'complete' | 'partial' | 'draft';

export type DayType = 'OFFICE' | 'WFH' | 'LEAVE' | 'HOLIDAY';

export interface AttendanceRecord {
  id: string;
  date: string;
  dayType: DayType;
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

/** Fixed hybrid policy: mandatory office days per month. */
export const MANDATORY_OFFICE_DAYS = 10;

/** Default full-day WFH block (09:00–18:15 = 09:15 total). */
export const WFH_DAY_START = '09:00';
export const WFH_DAY_END = '18:15';
export const WFH_DAY_TOTAL_HOURS = 9 + 15 / 60;

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
