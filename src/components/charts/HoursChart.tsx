import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AttendanceRecord } from '@/types';
import { formatDurationFromHours, formatShortDate } from '@/utils/time';

interface HoursChartProps {
  records: AttendanceRecord[];
}

export function HoursChart({ records }: HoursChartProps) {
  const data = records.map((r) => ({
    date: formatShortDate(r.date),
    office: r.officeHours,
    wfh: r.wfhHours,
    total: r.totalHours,
  }));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">No data for this period.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="officeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="wfhGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }} />
        <YAxis
          tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }}
          tickFormatter={(v: number) => formatDurationFromHours(v)}
        />
        <Tooltip
          contentStyle={{
            background: 'rgb(var(--color-surface-elevated))',
            border: '1px solid rgb(var(--color-border))',
            borderRadius: 12,
            fontSize: 13,
          }}
          formatter={(value: number, name: string) => [
            formatDurationFromHours(value),
            name,
          ]}
        />
        <Area
          type="monotone"
          dataKey="office"
          stackId="1"
          stroke="#2563eb"
          fill="url(#officeGrad)"
          name="Office"
        />
        <Area
          type="monotone"
          dataKey="wfh"
          stackId="1"
          stroke="#059669"
          fill="url(#wfhGrad)"
          name="WFH"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
