import type { AttendanceRecord, AppSettings } from '@/types';

const CSV_HEADERS = [
  'Date',
  'Day',
  'WFH1 Start',
  'WFH1 End',
  'Punch In',
  'Punch Out',
  'WFH2 Start',
  'WFH2 End',
  'Office Hours',
  'WFH Hours',
  'Total Hours',
  'Status',
];

function escapeCsv(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function dayName(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' });
}

export function recordsToCsv(records: AttendanceRecord[]): string {
  const rows = records.map((r) =>
    [
      r.date,
      dayName(r.date),
      r.wfh1Start,
      r.wfh1End,
      r.punchIn,
      r.punchOut,
      r.wfh2Start,
      r.wfh2End,
      r.officeHours.toFixed(2),
      r.wfhHours.toFixed(2),
      r.totalHours.toFixed(2),
      r.status,
    ]
      .map(escapeCsv)
      .join(','),
  );
  return [CSV_HEADERS.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  records: AttendanceRecord[];
  settings?: AppSettings;
}

export function recordsToJson(
  records: AttendanceRecord[],
  settings?: AppSettings,
): string {
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    settings,
  };
  return JSON.stringify(bundle, null, 2);
}

export function parseImportJson(text: string): ExportBundle {
  const data = JSON.parse(text) as ExportBundle;
  if (!data.records || !Array.isArray(data.records)) {
    throw new Error('Invalid backup file: missing records array.');
  }
  return data;
}
