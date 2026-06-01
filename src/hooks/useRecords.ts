import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteRecord, getSettings, saveRecord, getRecordByDate } from '@/db';
import type { AttendanceRecord, AppSettings } from '@/types';
import { WFH_DAY_END, WFH_DAY_START, WFH_DAY_TOTAL_HOURS } from '@/types';
import { computeAttendance, computePunchInOnly } from '@/utils/calculations';
import { hasAttendanceRecord } from '@/utils/recordHelpers';
import { currentLocalTime, hasValidPunchTime, todayDateString } from '@/utils/time';

export function useAllRecords() {
  return useLiveQuery(() => db.records.orderBy('date').reverse().toArray(), []);
}

export function useSettings() {
  return useLiveQuery(() => getSettings(), []);
}

export function useTodayRecord() {
  const today = todayDateString();
  return useLiveQuery(() => getRecordByDate(today), [today]);
}

export function useRecordByDate(date: string) {
  return useLiveQuery(() => getRecordByDate(date), [date]);
}

export function useMonthRecords(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return useLiveQuery(
    () => db.records.where('date').between(start, end, true, true).sortBy('date'),
    [start, end],
  );
}

function assertNoExistingRecord(existing: AttendanceRecord | undefined): void {
  if (hasAttendanceRecord(existing)) {
    throw new Error('An attendance record already exists for this date.');
  }
}

export async function recordPunchIn(
  date: string,
  settings: AppSettings,
): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  if (existing?.punchIn) {
    throw new Error('You have already punched in for this day.');
  }
  assertNoExistingRecord(existing);

  const punchIn = currentLocalTime();
  const partial = computePunchInOnly(date, punchIn, settings);

  const record: AttendanceRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    date,
    dayType: 'OFFICE',
    punchIn,
    punchOut: '',
    wfh1Start: partial.wfh1Start,
    wfh1End: partial.wfh1End,
    wfh2Start: partial.wfh2Start,
    wfh2End: partial.wfh2End,
    officeHours: partial.officeHours,
    wfhHours: partial.wfhHours,
    totalHours: partial.totalHours,
    status: 'partial',
  };

  await saveRecord(record);
  return record;
}

export async function recordPunchOut(
  date: string,
  settings: AppSettings,
): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  if (!existing?.punchIn) {
    throw new Error('Punch in before punching out.');
  }
  if (existing.punchOut) {
    throw new Error('You have already punched out for this day.');
  }

  const punchOut = currentLocalTime();
  return upsertDailyEntry(date, existing.punchIn, punchOut, settings);
}

export async function recordWorkFromHome(date: string): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  assertNoExistingRecord(existing);

  const record: AttendanceRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    date,
    dayType: 'WFH',
    wfh1Start: WFH_DAY_START,
    wfh1End: WFH_DAY_END,
    punchIn: '',
    punchOut: '',
    wfh2Start: '',
    wfh2End: '',
    officeHours: 0,
    wfhHours: WFH_DAY_TOTAL_HOURS,
    totalHours: WFH_DAY_TOTAL_HOURS,
    status: 'complete',
  };

  await saveRecord(record);
  return record;
}

export async function recordLeaveOrHoliday(
  date: string,
  dayType: 'LEAVE' | 'HOLIDAY',
): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  assertNoExistingRecord(existing);

  const record: AttendanceRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    date,
    dayType,
    wfh1Start: '',
    wfh1End: '',
    punchIn: '',
    punchOut: '',
    wfh2Start: '',
    wfh2End: '',
    officeHours: 0,
    wfhHours: 0,
    totalHours: 0,
    status: 'complete',
  };

  await saveRecord(record);
  return record;
}

export async function updatePunchIn(
  date: string,
  punchIn: string,
  settings: AppSettings,
): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  if (!existing?.punchIn) {
    throw new Error('No punch in recorded for this day.');
  }

  const attendanceDate = existing.date ?? date;
  const validPunchOut =
    existing.status === 'complete' && hasValidPunchTime(existing.punchOut);

  console.log('[updatePunchIn]', {
    selectedDate: date,
    attendanceDate,
    punchIn,
    punchOut: existing.punchOut,
    dayType: existing.dayType,
    recordStatus: existing.status,
    validPunchOut,
    willValidateAgainstPunchOut: validPunchOut,
  });

  if (validPunchOut) {
    return upsertDailyEntry(attendanceDate, punchIn, existing.punchOut, settings);
  }

  const partial = computePunchInOnly(attendanceDate, punchIn, settings);
  const record: AttendanceRecord = {
    ...existing,
    dayType: 'OFFICE',
    punchIn,
    wfh1Start: partial.wfh1Start,
    wfh1End: partial.wfh1End,
    wfh2Start: partial.wfh2Start,
    wfh2End: partial.wfh2End,
    officeHours: partial.officeHours,
    wfhHours: partial.wfhHours,
    totalHours: partial.totalHours,
    status: 'partial',
  };

  await saveRecord(record);
  return record;
}

export async function updatePunchOut(
  date: string,
  punchOut: string,
  settings: AppSettings,
): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  if (!existing?.punchIn) {
    throw new Error('Punch in before editing punch out.');
  }
  if (!hasValidPunchTime(punchOut)) {
    throw new Error('Enter a valid punch out time.');
  }

  const attendanceDate = existing.date ?? date;

  console.log('[updatePunchOut]', {
    selectedDate: date,
    attendanceDate,
    punchIn: existing.punchIn,
    punchOut,
    dayType: existing.dayType,
  });

  return upsertDailyEntry(attendanceDate, existing.punchIn, punchOut, settings);
}

export async function upsertDailyEntry(
  date: string,
  punchIn: string,
  punchOut: string,
  settings: AppSettings,
): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  const attendanceDate = existing?.date ?? date;

  console.log('[upsertDailyEntry]', {
    selectedDate: date,
    attendanceDate,
    punchIn,
    punchOut,
    dayType: existing?.dayType,
    validPunchIn: hasValidPunchTime(punchIn),
    validPunchOut: hasValidPunchTime(punchOut),
  });

  if (!hasValidPunchTime(punchIn) || !hasValidPunchTime(punchOut)) {
    throw new Error('Both punch in and punch out times are required to complete the day.');
  }

  const computed = computeAttendance(attendanceDate, punchIn, punchOut, settings);

  const record: AttendanceRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    date: attendanceDate,
    dayType: 'OFFICE',
    punchIn,
    punchOut,
    wfh1Start: computed.wfh1Start,
    wfh1End: computed.wfh1End,
    wfh2Start: computed.wfh2Start,
    wfh2End: computed.wfh2End,
    officeHours: computed.officeHours,
    wfhHours: computed.wfhHours,
    totalHours: computed.totalHours,
    status: 'complete',
  };

  await saveRecord(record);
  return record;
}

/** Removes the attendance record for a single date (no bulk reset). */
export async function resetAttendanceForDate(date: string): Promise<void> {
  const existing = await getRecordByDate(date);
  if (!existing) {
    throw new Error('No attendance record exists for this date.');
  }
  await deleteRecord(existing.id);
}
