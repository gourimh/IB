import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  semantic?: boolean
}

export function SearchBar({ value, onChange, semantic }: SearchBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search posts semantically…"
          className={cn(
            'w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-white text-sm',
            'text-text-primary placeholder-text-muted',
            'focus:border-brand-teal transition-colors duration-150'
          )}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {semantic && value && (
        <span className="text-2xs text-brand-purple font-medium px-1 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple inline-block" />
          Semantic search active
        </span>
      )}
    </div>
  )
}
