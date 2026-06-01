import { TONE_OPTIONS } from '../../lib/constants'
import { cn } from '../../lib/utils'

interface FilterBarProps {
  activeFilter: string
  onChange: (tone: string) => void
}

const ALL_FILTERS = [{ value: 'all', label: 'All' }, ...TONE_OPTIONS]

export function FilterBar({ activeFilter, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
            activeFilter === f.value
              ? 'bg-brand-teal text-white'
              : 'bg-surface text-text-secondary border border-border hover:bg-white hover:border-border-strong'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
