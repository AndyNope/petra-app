import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react'
import { PublicClientApplication, InteractionStatus } from '@azure/msal-browser'
import { msalConfig } from './msalConfig'
import { createContext, useContext } from 'react'

// MSAL-Instanz (Singleton, einmal initialisiert)
export const msalInstance = new PublicClientApplication(msalConfig)

// ── Auth-Kontext für einfachen Zugriff auf Rollen ───────────────────────────
const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

/**
 * Gibt die App-Rollen des eingeloggten Benutzers zurück.
 * Rollen kommen als Array im "roles"-Claim des ID-Tokens.
 */
function useRoles() {
  const { accounts } = useMsal()
  const account = accounts[0]
  if (!account) return []
  const claims = account.idTokenClaims
  if (!claims) return []
  const roles = claims['roles'] ?? claims['role'] ?? []
  return Array.isArray(roles) ? roles : [roles]
}

function AuthContextProvider({ children }) {
  const { instance, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const roles = useRoles()
  const { accounts } = useMsal()
  const account = accounts[0]

  function hasRole(...requiredRoles) {
    if (roles.includes('App.Admin')) return true
    return requiredRoles.some(r => roles.includes(r))
  }

  const value = {
    isAuthenticated,
    isLoading: inProgress !== InteractionStatus.None,
    account,
    roles,
    hasRole,
    displayName: account?.name ?? account?.username ?? '',
    login:  () => instance.loginRedirect({ scopes: ['openid', 'profile'] }),
    logout: () => instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </MsalProvider>
  )
}
