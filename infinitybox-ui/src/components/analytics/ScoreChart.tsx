import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'
import { Card } from '../ui/Card'

interface ScoreChartProps {
  data: Array<{ date: string; score: number }>
}

export function ScoreChart({ data }: ScoreChartProps) {
  const safeData = data ?? []
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Virality score over time</h3>
      {safeData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-text-muted text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#888780' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E2E0D8',
                borderRadius: '10px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#1D9E75"
              strokeWidth={2}
              dot={<Dot r={4} fill="#EF9F27" stroke="#EF9F27" />}
              activeDot={{ r: 5, fill: '#EF9F27' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
