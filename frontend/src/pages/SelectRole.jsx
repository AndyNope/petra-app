import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Car, Radio, LogIn } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { AppRoles } from '../auth/msalConfig'

const ALL_ROLES = [
  {
    to: '/employee',
    label: 'Mitarbeiter',
    description: 'Fahrt anfordern und Status verfolgen',
    Icon: Users,
    color: 'border-blue-300 hover:border-blue-500 hover:bg-blue-50',
    requiredRoles: [AppRoles.Mitarbeiter, AppRoles.Admin],
  },
  {
    to: '/taxi',
    label: 'Taxi',
    description: 'Standort eingeben und Auftraege annehmen',
    Icon: Car,
    color: 'border-green-300 hover:border-green-500 hover:bg-green-50',
    requiredRoles: [AppRoles.Taxifahrer, AppRoles.Admin],
  },
  {
    to: '/dispatch',
    label: 'Disposition',
    description: 'Taxis und Auftraege ueberwachen',
    Icon: Radio,
    color: 'border-gray-300 hover:border-gray-500 hover:bg-gray-50',
    requiredRoles: [AppRoles.Disposition, AppRoles.Admin],
  },
]

export default function SelectRole() {
  const { isAuthenticated, isLoading, hasRole, login } = useAuth()
  const navigate = useNavigate()

  const visibleRoles = ALL_ROLES.filter(r => !isAuthenticated || hasRole(...r.requiredRoles))

  // Auto-Redirect wenn nur eine Ansicht verfügbar
  useEffect(() => {
    if (!isLoading && isAuthenticated && visibleRoles.length === 1) {
      navigate(visibleRoles[0].to, { replace: true })
    }
  }, [isLoading, isAuthenticated, visibleRoles, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-sm">Lade...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Vorfeld Taxi Disposition</h1>
        <p className="mt-1 text-gray-500 text-sm">Flughafen Zurich — Ansicht waehlen</p>
      </div>

      {!isAuthenticated ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-500 text-sm">Bitte melde dich an, um fortzufahren.</p>
          <button
            onClick={login}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white
                       font-semibold px-6 py-3 rounded-xl shadow transition-colors"
          >
            <LogIn size={20} />
            Mit Microsoft anmelden
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {visibleRoles.map(({ to, label, description, Icon, color }) => (
            <Link
              key={to}
              to={to}
              className={`card p-6 flex flex-col items-center gap-3 text-center border-2 transition-colors ${color}`}
            >
              <Icon size={32} className="text-gray-700" />
              <div>
                <div className="font-semibold text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{description}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
