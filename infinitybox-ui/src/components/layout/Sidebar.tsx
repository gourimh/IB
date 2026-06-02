import { NavLink } from 'react-router-dom'
import { Sparkles, BookOpen, BarChart2, Lightbulb, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/', icon: Sparkles, label: 'Generate' },
  { to: '/topics', icon: Lightbulb, label: 'Topics' },
  { to: '/library', icon: BookOpen, label: 'Library' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-border flex flex-col z-40',
        'transition-transform duration-250 ease-in-out',
        // desktop: always visible
        'lg:translate-x-0',
        // mobile: slide in/out
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className="px-5 pt-6 pb-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-brand-teal font-bold text-[15px] tracking-tight">InfinityBox</div>
            <div className="text-text-muted text-2xs uppercase tracking-widest mt-0.5">
              Post Generator
            </div>
          </div>
          {/* close button — mobile only */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden p-1 rounded-lg text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                  isActive
                    ? 'bg-brand-teal-light text-brand-teal font-medium'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? 'text-brand-teal' : 'text-text-muted'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <div className="text-2xs text-text-muted">v2.0</div>
          <div className="text-2xs text-text-muted mt-0.5 leading-relaxed">
            Powered by Llama 3.3 · Groq
          </div>
        </div>
      </aside>
    </>
  )
}
