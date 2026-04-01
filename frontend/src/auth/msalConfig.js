/**
 * MSAL (Microsoft Authentication Library) Konfiguration
 *
 * Werte in .env.local eintragen:
 *   VITE_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   VITE_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   VITE_API_SCOPE=api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/access_as_user
 */

export const msalConfig = {
  auth: {
    clientId:    import.meta.env.VITE_AZURE_CLIENT_ID,
    authority:   `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation:        'sessionStorage', // sessionStorage = sicherer auf geteilten Geräten
    storeAuthStateInCookie: false,
  },
}

/**
 * Scopes für den API-Aufruf.
 * Wird verwendet um einen Bearer-Token für das .NET Backend anzufordern.
 */
export const apiScopes = [
  import.meta.env.VITE_API_SCOPE || 'user.read',
]

/**
 * Entra ID App-Rollennamen — müssen exakt mit der App Registration übereinstimmen.
 */
export const AppRoles = {
  Mitarbeiter: 'App.Mitarbeiter',
  Taxifahrer:  'App.Taxifahrer',
  Disposition: 'App.Disposition',
  Admin:       'App.Admin',
}
