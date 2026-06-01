import { NavLink } from 'react-router-dom'
import { Sparkles, BookOpen, BarChart2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/', icon: Sparkles, label: 'Generate' },
  { to: '/library', icon: BookOpen, label: 'Library' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-border flex flex-col z-20">
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <div className="text-brand-teal font-bold text-[15px] tracking-tight">InfinityBox</div>
        <div className="text-text-muted text-2xs uppercase tracking-widest mt-0.5">
          Post Generator
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
        <div className="text-2xs text-text-muted">v1.0</div>
        <div className="text-2xs text-text-muted mt-0.5 leading-relaxed">
          Built on Gemini 2.5 Flash (AI Studio)
        </div>
      </div>
    </aside>
  )
}
