import { Link } from 'react-router-dom'
import { Users, Car, Radio } from 'lucide-react'

const roles = [
  {
    to: '/employee',
    label: 'Mitarbeiter',
    description: 'Fahrt anfordern und Status verfolgen',
    Icon: Users,
    color: 'border-blue-300 hover:border-blue-500 hover:bg-blue-50',
  },
  {
    to: '/taxi',
    label: 'Taxi',
    description: 'Standort eingeben und Auftraege annehmen',
    Icon: Car,
    color: 'border-green-300 hover:border-green-500 hover:bg-green-50',
  },
  {
    to: '/dispatch',
    label: 'Disposition',
    description: 'Taxis und Auftraege ueberwachen',
    Icon: Radio,
    color: 'border-gray-300 hover:border-gray-500 hover:bg-gray-50',
  },
]

export default function SelectRole() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Vorfeld Taxi Disposition</h1>
        <p className="mt-1 text-gray-500 text-sm">Flughafen Zurich — Ansicht waehlen</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {roles.map(({ to, label, description, Icon, color }) => (
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
    </div>
  )
}
