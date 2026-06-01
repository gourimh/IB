import { FileText, Zap, Trophy, TrendingUp } from 'lucide-react'
import { Card } from '../ui/Card'
import type { AnalyticsData } from '../../lib/api'

interface StatsRowProps {
  data: AnalyticsData
}

export function StatsRow({ data }: StatsRowProps) {
  const stats = [
    {
      label: 'Total posts',
      value: data.total_posts,
      icon: FileText,
      color: 'text-brand-purple',
      bg: 'bg-brand-purple-light',
    },
    {
      label: 'Avg virality score',
      value: data.avg_virality_score ? `${data.avg_virality_score}` : '—',
      icon: Zap,
      color: 'text-brand-amber',
      bg: 'bg-brand-amber-light',
    },
    {
      label: 'Best tone',
      value: data.best_tone
        ? data.best_tone.replace('-', ' ')
        : '—',
      icon: Trophy,
      color: 'text-brand-teal',
      bg: 'bg-brand-teal-light',
    },
    {
      label: 'Posts this week',
      value: data.posts_this_week,
      icon: TrendingUp,
      color: 'text-brand-teal',
      bg: 'bg-brand-teal-light',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="flex items-start gap-3 p-4">
          <div className={`p-2 rounded-lg ${s.bg}`}>
            <s.icon size={16} className={s.color} />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary leading-tight">{s.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}
