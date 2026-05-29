import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AttendanceChartProps {
  data: { month: string; percentage: number; officeDays: number; required: number }[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">No attendance data yet.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }} />
        <Tooltip
          formatter={(value: number) => [`${value}%`, 'Attendance']}
          contentStyle={{
            background: 'rgb(var(--color-surface-elevated))',
            border: '1px solid rgb(var(--color-border))',
            borderRadius: 12,
            fontSize: 13,
          }}
        />
        <Bar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]} name="Attendance %" />
      </BarChart>
    </ResponsiveContainer>
  );
}
