import { Outlet, NavLink } from 'react-router-dom'
import { Users, Car, Radio } from 'lucide-react'

const navItems = [
  { to: '/employee', label: 'Mitarbeiter', Icon: Users },
  { to: '/taxi',     label: 'Taxi',        Icon: Car },
  { to: '/dispatch', label: 'Disposition', Icon: Radio },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold tracking-wide text-lg">Vorfeld Taxi — ZRH</span>
          <nav className="flex gap-1">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'}`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
