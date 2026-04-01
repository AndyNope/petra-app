import { Outlet, NavLink } from 'react-router-dom'
import { Users, Car, Radio } from 'lucide-react'

const navItems = [
  { to: '/employee', label: 'Mitarbeiter', Icon: Users },
  { to: '/taxi',     label: 'Taxi',        Icon: Car },
  { to: '/dispatch', label: 'Disposition', Icon: Radio },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Schmaler Header — nur Titel */}
      <header className="bg-blue-800 text-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <span className="font-semibold tracking-wide text-lg">Vorfeld Taxi — ZRH</span>
        </div>
      </header>

      {/* pb-24 damit Inhalt nicht hinter Bottom-Nav verschwindet */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5 pb-24">
        <Outlet />
      </main>

      {/* Fixe Bottom-Navigation — Daumen-Zone, mindestens 64px hoch */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-5xl mx-auto flex">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-semibold
                 transition-colors select-none
                 ${isActive
                   ? 'text-blue-700 border-t-2 border-blue-700 -mt-px'
                   : 'text-gray-500 hover:text-gray-800 border-t-2 border-transparent'}`
              }
            >
              <Icon size={24} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
