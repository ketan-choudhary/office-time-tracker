import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isWeekend,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import type { AppSettings, AttendanceRecord } from '@/types';
import { MANDATORY_OFFICE_DAYS } from '@/types';
import { resolveDayType } from './recordHelpers';
import { monthEnd, monthStart } from './time';

export interface WorkingDayBreakdown {
  calendarDays: number;
  weekendDays: number;
  holidayDays: number;
  workingDays: number;
}

export interface MonthComplianceSnapshot extends WorkingDayBreakdown {
  officeDaysCompleted: number;
  officeDaysRequired: number;
  totalValidWFODays: number;
  remainingOfficeDays: number;
  wfhUsed: number;
  wfhEligible: number;
  remainingWFH: number;
  leaveDays: number;
}

export interface WFHTomorrowVerdict {
  canWFH: boolean;
  headline: 'YES' | 'NO';
  explanation: string;
  officeDaysCompleted: number;
  officeDaysRequired: number;
  wfhUsed: number;
  wfhEligible: number;
  remainingWFH: number;
}

export interface SkipOfficeVerdict {
  canSkip: boolean;
  headline: 'YES' | 'NO';
  explanation: string;
}

function dateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function holidayDatesInRecords(records: AttendanceRecord[]): Set<string> {
  const set = new Set<string>();
  for (const r of records) {
    if (resolveDayType(r) === 'HOLIDAY') set.add(r.date);
  }
  return set;
}

function countWeekdaysInInterval(start: Date, end: Date, holidayDates: Set<string>): number {
  return eachDayOfInterval({ start, end }).filter(
    (d) => !isWeekend(d) && !holidayDates.has(dateKey(d)),
  ).length;
}

function countWeekendsInInterval(start: Date, end: Date): number {
  return eachDayOfInterval({ start, end }).filter((d) => isWeekend(d)).length;
}

export function getWorkingDayBreakdown(
  records: AttendanceRecord[],
  ref: Date = new Date(),
): WorkingDayBreakdown {
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  const holidayDates = holidayDatesInRecords(
    records.filter((r) => r.date >= monthStart(ref) && r.date <= monthEnd(ref)),
  );
  const calendarDays = eachDayOfInterval({ start, end }).length;
  const weekendDays = countWeekendsInInterval(start, end);
  const weekdayHolidays = [...holidayDates].filter((d) => {
    const parsed = parseISO(d);
    return parsed >= start && parsed <= end && !isWeekend(parsed);
  }).length;
  const workingDays = countWeekdaysInInterval(start, end, holidayDates);

  return {
    calendarDays,
    weekendDays,
    holidayDays: weekdayHolidays,
    workingDays,
  };
}

export function getWorkingDayBreakdownForRange(
  records: AttendanceRecord[],
  startDate: string,
  endDate: string,
): WorkingDayBreakdown {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const holidayDates = holidayDatesInRecords(
    records.filter((r) => r.date >= startDate && r.date <= endDate),
  );
  const calendarDays = eachDayOfInterval({ start, end }).length;
  const weekendDays = countWeekendsInInterval(start, end);
  const weekdayHolidays = [...holidayDates].filter((d) => !isWeekend(parseISO(d))).length;
  const workingDays = countWeekdaysInInterval(start, end, holidayDates);

  return {
    calendarDays,
    weekendDays,
    holidayDays: weekdayHolidays,
    workingDays,
  };
}

export function getWFHEligibleDays(workingDays: number, officeDaysRequired: number): number {
  return Math.max(0, workingDays - officeDaysRequired);
}

function filterMonthRecords(records: AttendanceRecord[], ref: Date): AttendanceRecord[] {
  const start = monthStart(ref);
  const end = monthEnd(ref);
  return records.filter((r) => r.date >= start && r.date <= end);
}

export function countDayTypesInPeriod(records: AttendanceRecord[]): {
  office: number;
  wfh: number;
  leave: number;
  holiday: number;
} {
  const counts = { office: 0, wfh: 0, leave: 0, holiday: 0 };
  for (const r of records) {
    const t = resolveDayType(r);
    if (t === 'OFFICE') counts.office += 1;
    else if (t === 'WFH') counts.wfh += 1;
    else if (t === 'LEAVE') counts.leave += 1;
    else if (t === 'HOLIDAY') counts.holiday += 1;
  }
  return counts;
}

export function getMonthComplianceSnapshot(
  records: AttendanceRecord[],
  ref: Date = new Date(),
  settings?: AppSettings | null,
): MonthComplianceSnapshot {
  const officeDaysRequired =
    settings?.officeDaysRequiredPerMonth ?? MANDATORY_OFFICE_DAYS;
  const monthRecords = filterMonthRecords(records, ref);
  const breakdown = getWorkingDayBreakdown(records, ref);
  const dayCounts = countDayTypesInPeriod(monthRecords);

  const officeDaysCompleted = dayCounts.office;
  const wfhUsed = dayCounts.wfh;
  
  // Calculate totalValidWFODays = workingDays - fullDayLeaves
  // This excludes weekends, holidays, and full-day leaves from the target
  const totalValidWFODays = Math.max(0, breakdown.workingDays - dayCounts.leave);
  
  const wfhEligible = getWFHEligibleDays(breakdown.workingDays, officeDaysRequired);
  const remainingOfficeDays = Math.max(0, officeDaysRequired - officeDaysCompleted);
  const remainingWFH = Math.max(0, wfhEligible - wfhUsed);

  return {
    ...breakdown,
    officeDaysCompleted,
    officeDaysRequired,
    totalValidWFODays,
    remainingOfficeDays,
    wfhUsed,
    wfhEligible,
    remainingWFH,
    holidayDays: dayCounts.holiday,
    leaveDays: dayCounts.leave,
  };
}

function countWorkingDaysFromTomorrow(
  records: AttendanceRecord[],
  ref: Date,
): number {
  const tomorrow = startOfDay(addDays(ref, 1));
  const lastDay = endOfMonth(ref);
  if (tomorrow > lastDay) return 0;
  const holidayDates = holidayDatesInRecords(filterMonthRecords(records, ref));
  return countWeekdaysInInterval(tomorrow, lastDay, holidayDates);
}

function countWorkingDaysAfterTomorrow(
  records: AttendanceRecord[],
  ref: Date,
): number {
  const dayAfter = startOfDay(addDays(ref, 2));
  const lastDay = endOfMonth(ref);
  if (dayAfter > lastDay) return 0;
  const holidayDates = holidayDatesInRecords(filterMonthRecords(records, ref));
  return countWeekdaysInInterval(dayAfter, lastDay, holidayDates);
}

function isTomorrowNonWorking(records: AttendanceRecord[], ref: Date): boolean {
  const tomorrow = addDays(ref, 1);
  if (isWeekend(tomorrow)) return true;
  const tomorrowKey = dateKey(tomorrow);
  return records.some(
    (r) => r.date === tomorrowKey && resolveDayType(r) === 'HOLIDAY',
  );
}

export function evaluateWFHTomorrow(
  records: AttendanceRecord[],
  ref: Date = new Date(),
  settings?: AppSettings | null,
): WFHTomorrowVerdict {
  const snapshot = getMonthComplianceSnapshot(records, ref, settings);

  if (isTomorrowNonWorking(records, ref)) {
    return {
      canWFH: true,
      headline: 'YES',
      explanation: 'Tomorrow is not a working day (weekend or holiday).',
      officeDaysCompleted: snapshot.officeDaysCompleted,
      officeDaysRequired: snapshot.officeDaysRequired,
      wfhUsed: snapshot.wfhUsed,
      wfhEligible: snapshot.wfhEligible,
      remainingWFH: snapshot.remainingWFH,
    };
  }

  if (snapshot.remainingWFH <= 0) {
    return {
      canWFH: false,
      headline: 'NO',
      explanation: 'No WFH days remaining this month.',
      officeDaysCompleted: snapshot.officeDaysCompleted,
      officeDaysRequired: snapshot.officeDaysRequired,
      wfhUsed: snapshot.wfhUsed,
      wfhEligible: snapshot.wfhEligible,
      remainingWFH: snapshot.remainingWFH,
    };
  }

  const remainingOffice = snapshot.remainingOfficeDays;
  const workingFromTomorrow = countWorkingDaysFromTomorrow(records, ref);
  const workingAfterTomorrow = countWorkingDaysAfterTomorrow(records, ref);

  if (remainingOffice === 0) {
    return {
      canWFH: true,
      headline: 'YES',
      explanation: 'Office target is met; you can WFH tomorrow.',
      officeDaysCompleted: snapshot.officeDaysCompleted,
      officeDaysRequired: snapshot.officeDaysRequired,
      wfhUsed: snapshot.wfhUsed,
      wfhEligible: snapshot.wfhEligible,
      remainingWFH: snapshot.remainingWFH,
    };
  }

  if (workingFromTomorrow === 0) {
    return {
      canWFH: false,
      headline: 'NO',
      explanation: `You still need ${remainingOffice} office visit${remainingOffice === 1 ? '' : 's'} this month.`,
      officeDaysCompleted: snapshot.officeDaysCompleted,
      officeDaysRequired: snapshot.officeDaysRequired,
      wfhUsed: snapshot.wfhUsed,
      wfhEligible: snapshot.wfhEligible,
      remainingWFH: snapshot.remainingWFH,
    };
  }

  const officeIfWFHTomorrow = remainingOffice;
  const maxOfficeAfterTomorrow = workingAfterTomorrow;

  if (officeIfWFHTomorrow <= maxOfficeAfterTomorrow) {
    return {
      canWFH: true,
      headline: 'YES',
      explanation: 'You can WFH tomorrow and still meet your monthly office target.',
      officeDaysCompleted: snapshot.officeDaysCompleted,
      officeDaysRequired: snapshot.officeDaysRequired,
      wfhUsed: snapshot.wfhUsed,
      wfhEligible: snapshot.wfhEligible,
      remainingWFH: snapshot.remainingWFH,
    };
  }

  return {
    canWFH: false,
    headline: 'NO',
    explanation: `You need ${remainingOffice} more office day${remainingOffice === 1 ? '' : 's'} with only ${workingAfterTomorrow} working day${workingAfterTomorrow === 1 ? '' : 's'} left after tomorrow.`,
    officeDaysCompleted: snapshot.officeDaysCompleted,
    officeDaysRequired: snapshot.officeDaysRequired,
    wfhUsed: snapshot.wfhUsed,
    wfhEligible: snapshot.wfhEligible,
    remainingWFH: snapshot.remainingWFH,
  };
}

/** Weekdays from tomorrow through end of current month (inclusive). */
export function countWeekdaysFromTomorrow(ref: Date = new Date()): number {
  const tomorrow = startOfDay(addDays(ref, 1));
  const lastDay = endOfMonth(ref);
  if (tomorrow > lastDay) return 0;
  return eachDayOfInterval({ start: tomorrow, end: lastDay }).filter((d) => !isWeekend(d))
    .length;
}

export function evaluateSkipOfficeTomorrow(
  officeDaysCompleted: number,
  officeDaysRequired: number,
  ref: Date = new Date(),
): SkipOfficeVerdict {
  const remainingNeeded = Math.max(0, officeDaysRequired - officeDaysCompleted);
  const workingDaysFromTomorrow = countWeekdaysFromTomorrow(ref);

  if (remainingNeeded === 0) {
    return {
      canSkip: true,
      headline: 'YES',
      explanation: 'You are ahead of target.',
    };
  }

  if (workingDaysFromTomorrow === 0) {
    return {
      canSkip: false,
      headline: 'NO',
      explanation: `You still need ${remainingNeeded} office visit${remainingNeeded === 1 ? '' : 's'} this month.`,
    };
  }

  if (remainingNeeded < workingDaysFromTomorrow) {
    return {
      canSkip: true,
      headline: 'YES',
      explanation: 'You can skip tomorrow and still meet your monthly target.',
    };
  }

  if (remainingNeeded === workingDaysFromTomorrow) {
    return {
      canSkip: false,
      headline: 'NO',
      explanation: `You need every remaining working day (${remainingNeeded}) in the office this month.`,
    };
  }

  return {
    canSkip: false,
    headline: 'NO',
    explanation: `You still need ${remainingNeeded} office visits this month with only ${workingDaysFromTomorrow} working day${workingDaysFromTomorrow === 1 ? '' : 's'} left after tomorrow.`,
  };
}

export function getOfficeDaysComplianceColor(officeDaysCompleted: number): string {
  if (officeDaysCompleted >= 10) return 'text-success';
  if (officeDaysCompleted >= 7) return 'text-[#84cc16]';
  if (officeDaysCompleted >= 4) return 'text-warning';
  return 'text-danger';
}

export function getOfficeDaysComplianceBarColor(officeDaysCompleted: number): string {
  if (officeDaysCompleted >= 10) return 'bg-success';
  if (officeDaysCompleted >= 7) return 'bg-[#84cc16]';
  if (officeDaysCompleted >= 4) return 'bg-warning';
  return 'bg-danger';
}

export function getWFHUsageColor(wfhUsed: number, wfhEligible: number): string {
  if (wfhEligible <= 0) return 'text-text-muted';
  const ratio = wfhUsed / wfhEligible;
  if (ratio >= 1) return 'text-danger';
  if (ratio >= 0.75) return 'text-warning';
  return 'text-success';
}

export function getWFHUsageBarColor(wfhUsed: number, wfhEligible: number): string {
  if (wfhEligible <= 0) return 'bg-surface-muted';
  const ratio = wfhUsed / wfhEligible;
  if (ratio >= 1) return 'bg-danger';
  if (ratio >= 0.75) return 'bg-warning';
  return 'bg-success';
}
