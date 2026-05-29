import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings, saveRecord, getRecordByDate } from '@/db';
import type { AttendanceRecord, AppSettings } from '@/types';
import { computeAttendance } from '@/utils/calculations';
import { todayDateString } from '@/utils/time';

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

export function useMonthRecords(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return useLiveQuery(
    () => db.records.where('date').between(start, end, true, true).sortBy('date'),
    [start, end],
  );
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
    late: computed.late,
    status: 'complete',
  };

  await saveRecord(record);
  return record;
}
