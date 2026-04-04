import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { Severity, Threshold } from '../types';

const SEVERITY_COLOUR: Record<Severity, string> = {
  low:      '#22c55e',
  medium:   '#eab308',
  high:     '#f97316',
  critical: '#ef4444',
};

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];

interface ChartRow {
  metric: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

function buildChartData(thresholds: Threshold[]): ChartRow[] {
  const metrics = [...new Set(thresholds.map(t => t.metric))].sort();
  return metrics.map(metric => {
    const row: ChartRow = { metric, low: 0, medium: 0, high: 0, critical: 0 };
    for (const t of thresholds.filter(t2 => t2.metric === metric && t2.is_active)) {
      row[t.severity]++;
    }
    return row;
  });
}

export default function SeverityChart({ thresholds }: { thresholds: Threshold[] }) {
  const data = buildChartData(thresholds);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No active thresholds to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          className="capitalize"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          cursor={{ fill: '#f8fafc' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
        />
        {SEVERITIES.map(s => (
          <Bar key={s} dataKey={s} name={s} stackId="a" radius={s === 'critical' ? [3, 3, 0, 0] : [0, 0, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={SEVERITY_COLOUR[s]} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
