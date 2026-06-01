interface TopBarProps {
  title: string
  action?: React.ReactNode
}

export function TopBar({ title, action }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-white sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-text-primary tracking-tight">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}
