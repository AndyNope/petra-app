import { Outlet, NavLink } from 'react-router-dom'
import { Users, Car, Radio, LogIn, LogOut, UserCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'

const navItems = [
  { to: '/employee', label: 'Mitarbeiter', Icon: Users },
  { to: '/taxi',     label: 'Taxi',        Icon: Car },
  { to: '/dispatch', label: 'Disposition', Icon: Radio },
]

export default function Layout() {
  const { isAuthenticated, displayName, login, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header mit App-Titel + Login/Logout */}
      <header className="bg-blue-800 text-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="font-semibold tracking-wide text-base">Vorfeld Taxi — ZRH</span>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-blue-100 text-sm">
                <UserCircle size={16} />
                {displayName}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm
                           bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogOut size={15} />
                Abmelden
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm
                         bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogIn size={15} />
              Anmelden
            </button>
          )}
        </div>
      </header>

      {/* pb-24 damit Inhalt nicht hinter Bottom-Nav verschwindet */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5 pb-24">
        <Outlet />
      </main>

      {/* Fixe Bottom-Navigation */}
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
