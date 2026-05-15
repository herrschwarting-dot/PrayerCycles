import { NavLink } from 'react-router-dom'
import { Square, ScrollText, Clock } from 'lucide-react'

const tabs = [
  { to: '/', icon: Square, label: 'Tap Pray' },
  { to: '/lists', icon: ScrollText, label: 'Prayer Lists' },
  { to: '/timer', icon: Clock, label: 'Timebox' },
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
              `flex flex-1 flex-col items-center gap-1 pt-3 pb-6 text-xs transition-colors ${
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
