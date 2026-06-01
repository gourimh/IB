import { cn } from '../../lib/utils'
import { TONE_COLORS } from '../../lib/constants'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'tone' | 'score' | 'engagement' | 'winner' | 'default'
  tone?: string
  className?: string
}

export function Badge({ children, variant = 'default', tone, className }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium'

  const variants = {
    default: 'bg-surface text-text-secondary',
    tone: tone ? TONE_COLORS[tone] || 'bg-surface text-text-secondary' : 'bg-surface text-text-secondary',
    score: 'bg-brand-amber-light text-brand-amber',
    engagement: 'bg-brand-teal-light text-brand-teal',
    winner: 'bg-brand-teal text-white',
  }

  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  )
}
