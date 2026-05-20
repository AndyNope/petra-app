const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
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
