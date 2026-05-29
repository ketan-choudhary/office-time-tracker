import Dexie, { type EntityTable } from 'dexie';
import type { AppSettings, AttendanceRecord } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

class OfficeTimeDB extends Dexie {
  records!: EntityTable<AttendanceRecord, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('OfficeTimeTracker');
    this.version(1).stores({
      records: 'id, date',
      settings: 'id',
    });
    this.version(2)
      .stores({
        records: 'id, date',
        settings: 'id',
      })
      .upgrade(async (tx) => {
        const records = await tx.table('records').toArray();
        await Promise.all(
          records.map((record) => {
            const { late: _late, ...rest } = record as AttendanceRecord & { late?: boolean };
            return tx.table('records').put(rest);
          }),
        );
      });
  }
}

export const db = new OfficeTimeDB();

export async function initDatabase(): Promise<void> {
  const existing = await db.settings.get('settings');
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS);
  }
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('settings');
  return settings ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({ ...settings, id: 'settings' });
}

export async function getRecordByDate(date: string): Promise<AttendanceRecord | undefined> {
  return db.records.where('date').equals(date).first();
}

export async function saveRecord(record: AttendanceRecord): Promise<void> {
  await db.records.put(record);
}

export async function deleteRecord(id: string): Promise<void> {
  await db.records.delete(id);
}

export async function getAllRecords(): Promise<AttendanceRecord[]> {
  return db.records.orderBy('date').reverse().toArray();
}

export async function getRecordsInRange(
  startDate: string,
  endDate: string,
): Promise<AttendanceRecord[]> {
  return db.records
    .where('date')
    .between(startDate, endDate, true, true)
    .reverse()
    .sortBy('date');
}

export async function importRecords(records: AttendanceRecord[]): Promise<void> {
  const normalized = records.map((record) => {
    const { late: _late, ...rest } = record as AttendanceRecord & { late?: boolean };
    return rest;
  });
  await db.records.bulkPut(normalized);
}

export async function clearAllRecords(): Promise<void> {
  await db.records.clear();
}
