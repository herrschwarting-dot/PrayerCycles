import { NavLink } from 'react-router-dom'
import { Sun, List, Timer } from 'lucide-react'

const tabs = [
  { to: '/', icon: Sun, label: "Today's Prayers" },
  { to: '/lists', icon: List, label: 'Lists' },
  { to: '/timer', icon: Timer, label: 'Timer' },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                isActive ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
