import { useAuth } from '../../auth/AuthProvider'

/**
 * Schützt eine Route anhand von Entra-ID-Rollen.
 * Zeigt Fehlermeldung wenn Rolle fehlt, Login-Button wenn nicht angemeldet.
 */
export default function ProtectedRoute({ roles = [], children }) {
  const { isAuthenticated, isLoading, hasRole, login } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500 text-sm">Anmeldung wird geprüft…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-gray-700 font-medium">Bitte melden Sie sich an.</div>
        <button onClick={login} className="btn-primary">
          Mit Microsoft anmelden
        </button>
      </div>
    )
  }

  if (roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="text-2xl font-bold text-red-600">Kein Zugriff</div>
        <div className="text-gray-600 text-sm text-center max-w-xs">
          Sie haben keine Berechtigung für diese Ansicht.
          Bitte wenden Sie sich an Ihren IT-Administrator.
        </div>
      </div>
    )
  }

  return children
}
