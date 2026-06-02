import { Menu } from 'lucide-react'

interface TopBarProps {
  title: string
  action?: React.ReactNode
  onMenuClick?: () => void
}

export function TopBar({ title, action, onMenuClick }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-border bg-white sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
