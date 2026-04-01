import { msalInstance } from '../auth/AuthProvider'
import { apiScopes } from '../auth/msalConfig'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Holt einen aktuellen Access Token vom MSAL-Cache (oder erneuert ihn still).
 * Wirft einen Fehler wenn kein Account vorhanden.
 */
async function getAccessToken() {
  const account = msalInstance.getAllAccounts()[0]
  if (!account) throw new Error('Nicht angemeldet.')
  const result = await msalInstance.acquireTokenSilent({
    scopes: apiScopes,
    account,
  })
  return result.accessToken
}

async function request(path, options = {}) {
  const token = await getAccessToken()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.Error || `HTTP ${res.status}`)
  return data
}


// Trips
export const createTrip = (body) => request('/trips', { method: 'POST', body })
export const getTrip = (id) => request(`/trips?trip_id=${id}`)
export const getTrips = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return request(`/trips${q ? '?' + q : ''}`)
}
export const acceptTrip = (tripId, taxiId) =>
  request(`/trips/${tripId}/accept`, { method: 'PATCH', body: { taxi_id: taxiId } })
export const completeTrip = (tripId, taxiId, position) =>
  request(`/trips/${tripId}/complete`, { method: 'PATCH', body: { taxi_id: taxiId, position } })
export const cancelTrip = (tripId, taxiId) =>
  request(`/trips/${tripId}/cancel`, { method: 'PATCH', body: { taxi_id: taxiId } })

// Taxis
export const registerTaxi = (body) => request('/taxis', { method: 'POST', body })
export const getTaxis = () => request('/taxis')
export const updateTaxiPosition = (id, position) =>
  request(`/taxis/${id}/position`, { method: 'PATCH', body: { position } })
export const deactivateTaxi = (id) =>
  request(`/taxis/${id}/deactivate`, { method: 'PATCH' })

// Dispatch
export const getDispatch = () => request('/dispatch')
