import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card } from '../ui/Card'

interface ToneChartProps {
  data: Record<string, number>
}

export function ToneChart({ data }: ToneChartProps) {
  const chartData = Object.entries(data ?? {}).map(([tone, count]) => ({
    tone: tone.replace('-', ' '),
    count,
  }))

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Posts by tone</h3>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-text-muted text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" vertical={false} />
            <XAxis
              dataKey="tone"
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E2E0D8',
                borderRadius: '10px',
                fontSize: '12px',
              }}
              cursor={{ fill: '#F1EFE8' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#1D9E75" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
