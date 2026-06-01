import Dexie, { type EntityTable } from 'dexie';
import type { AppSettings, AttendanceRecord } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

type LegacyRecord = AttendanceRecord & { late?: boolean };

function stripLegacyLate(record: LegacyRecord): AttendanceRecord {
  const copy = { ...record };
  delete copy.late;
  return copy;
}

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
          records.map((record) =>
            tx.table('records').put(stripLegacyLate(record as LegacyRecord)),
          ),
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
  const normalized = records.map((record) => stripLegacyLate(record as LegacyRecord));
  await db.records.bulkPut(normalized);
}

export async function clearAllRecords(): Promise<void> {
  await db.records.clear();
}
