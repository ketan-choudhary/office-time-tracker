import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings, saveRecord, getRecordByDate } from '@/db';
import type { AttendanceRecord, AppSettings } from '@/types';
import { computeAttendance, computePunchInOnly } from '@/utils/calculations';
import { currentLocalTime, todayDateString } from '@/utils/time';

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

export async function recordPunchIn(
  date: string,
  settings: AppSettings,
): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  if (existing?.punchIn) {
    throw new Error('You have already punched in for this day.');
  }

  const punchIn = currentLocalTime();
  const partial = computePunchInOnly(date, punchIn, settings);

  const record: AttendanceRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    date,
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

export async function updatePunchIn(
  date: string,
  punchIn: string,
  settings: AppSettings,
): Promise<AttendanceRecord> {
  const existing = await getRecordByDate(date);
  if (!existing?.punchIn) {
    throw new Error('No punch in recorded for this day.');
  }

  if (existing.punchOut) {
    return upsertDailyEntry(date, punchIn, existing.punchOut, settings);
  }

  const partial = computePunchInOnly(date, punchIn, settings);
  const record: AttendanceRecord = {
    ...existing,
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
  if (!existing.punchOut) {
    throw new Error('Punch out is not recorded yet.');
  }

  return upsertDailyEntry(date, existing.punchIn, punchOut, settings);
}

export async function upsertDailyEntry(
  date: string,
  punchIn: string,
  punchOut: string,
  settings: AppSettings,
): Promise<AttendanceRecord> {
  const computed = computeAttendance(date, punchIn, punchOut, settings);
  const existing = await getRecordByDate(date);

  const record: AttendanceRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    date,
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
