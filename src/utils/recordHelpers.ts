import type { AttendanceRecord, DayType } from '@/types';

type LegacyRecord = AttendanceRecord & { late?: boolean; dayType?: DayType };

export function resolveDayType(record: Pick<AttendanceRecord, 'dayType'>): DayType {
  return record.dayType ?? 'OFFICE';
}

export function inferDayType(record: Omit<AttendanceRecord, 'dayType'> & { dayType?: DayType }): DayType {
  if (record.dayType) return record.dayType;
  return 'OFFICE';
}

export function normalizeRecord(record: LegacyRecord): AttendanceRecord {
  const copy = { ...record };
  delete copy.late;
  return {
    ...copy,
    dayType: inferDayType(copy),
  };
}

export function hasAttendanceRecord(record: AttendanceRecord | undefined | null): boolean {
  return Boolean(record);
}
