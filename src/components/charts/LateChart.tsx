import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface LateChartProps {
  data: { month: string; late: number; onTime: number }[];
}

export function LateChart({ data }: LateChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">No late arrival data yet.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }} />
        <Tooltip
          contentStyle={{
            background: 'rgb(var(--color-surface-elevated))',
            border: '1px solid rgb(var(--color-border))',
            borderRadius: 12,
            fontSize: 13,
          }}
        />
        <Bar dataKey="onTime" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} name="On Time" />
        <Bar dataKey="late" stackId="a" fill="#dc2626" radius={[6, 6, 0, 0]} name="Late" />
      </BarChart>
    </ResponsiveContainer>
  );
}
