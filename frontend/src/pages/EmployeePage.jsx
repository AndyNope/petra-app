import { useState, useCallback } from 'react'
import { Send, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import ZoneSelect from '../components/shared/ZoneSelect'
import StatusBadge from '../components/shared/StatusBadge'
import ErrorMessage from '../components/shared/ErrorMessage'
import { createTrip, getTrip } from '../utils/api'
import { usePolling } from '../hooks/usePolling'
import { ZONE_LABELS, formatTime } from '../utils/constants'

const FORM_INITIAL = {
  pickup_zone: '',
  pickup_detail: '',
  dropoff_zone: '',
  dropoff_detail: '',
  passengers: 1,
}

export default function EmployeePage() {
  const [form, setForm]         = useState(FORM_INITIAL)
  const [submitting, setSub]    = useState(false)
  const [error, setError]       = useState(null)
  const [trip, setTrip]         = useState(null)   // angeforderter Auftrag
  const [lastRefresh, setRefresh] = useState(null)

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSub(true)
    try {
      const created = await createTrip({
        pickup_zone:    form.pickup_zone,
        pickup_detail:  form.pickup_detail || undefined,
        dropoff_zone:   form.dropoff_zone,
        dropoff_detail: form.dropoff_detail || undefined,
        passengers:     Number(form.passengers),
      })
      setTrip(created)
    } catch (err) {
      setError(err.message)
    } finally {
      setSub(false)
    }
  }

  // Polling fuer Statusaktualisierung (10s), nur wenn Auftrag vorhanden
  const refresh = useCallback(async () => {
    if (!trip?.id) return
    try {
      const updated = await getTrip(trip.id)
      setTrip(updated)
      setRefresh(new Date())
    } catch { /* still polling */ }
  }, [trip?.id])

  usePolling(refresh, 10000, !!trip?.id)

  function handleNewRequest() {
    setTrip(null)
    setForm(FORM_INITIAL)
    setError(null)
  }

  if (trip) {
    const isTerminal = ['completed', 'cancelled'].includes(trip.status)
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Ihr Auftrag</h2>
            <StatusBadge status={trip.status} overflow={trip.overflow_warning} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Abholort</dt>
              <dd className="font-medium">
                {trip.pickup_zone} – {ZONE_LABELS[trip.pickup_zone]}
                {trip.pickup_detail && ` (${trip.pickup_detail})`}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Zielort</dt>
              <dd className="font-medium">
                {trip.dropoff_zone} – {ZONE_LABELS[trip.dropoff_zone]}
                {trip.dropoff_detail && ` (${trip.dropoff_detail})`}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Personen</dt>
              <dd className="font-medium">{trip.passengers}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Angefordert</dt>
              <dd className="font-medium">{formatTime(trip.requested_at)}</dd>
            </div>
            {trip.taxi_radio_id && (
              <div className="col-span-2">
                <dt className="text-gray-500">Taxi (Funknummer)</dt>
                <dd className="font-medium">{trip.taxi_radio_id}</dd>
              </div>
            )}
            {trip.accepted_at && (
              <div>
                <dt className="text-gray-500">Angenommen</dt>
                <dd className="font-medium">{formatTime(trip.accepted_at)}</dd>
              </div>
            )}
            {trip.completed_at && (
              <div>
                <dt className="text-gray-500">Abgeschlossen</dt>
                <dd className="font-medium">{formatTime(trip.completed_at)}</dd>
              </div>
            )}
          </dl>

          {!isTerminal && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <RefreshCw size={12} />
              Aktualisierung alle 10 Sekunden
              {lastRefresh && ` — zuletzt ${formatTime(lastRefresh.toISOString())}`}
            </div>
          )}

          {trip.status === 'pending' && (
            <div className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-yellow-800 text-sm">
              <Clock size={14} />
              Warte auf Taxifahrer…
            </div>
          )}

          {trip.status === 'accepted' && (
            <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-blue-800 text-sm">
              <CheckCircle size={14} />
              Taxi ist unterwegs zu Ihnen.
            </div>
          )}

          <button onClick={handleNewRequest} className="btn-secondary w-full justify-center">
            Neue Anfrage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Fahrt anfordern</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ZoneSelect
            id="pickup"
            label="Abholplatz"
            value={form.pickup_zone}
            onChange={set('pickup_zone')}
          />

          <div>
            <label htmlFor="pickup_detail" className="label">
              Platznummer (optional)
            </label>
            <input
              id="pickup_detail"
              type="text"
              className="input"
              placeholder="z. B. A42"
              maxLength={20}
              value={form.pickup_detail}
              onChange={(e) => setForm((f) => ({ ...f, pickup_detail: e.target.value }))}
            />
          </div>

          <ZoneSelect
            id="dropoff"
            label="Zielort"
            value={form.dropoff_zone}
            onChange={set('dropoff_zone')}
          />

          <div>
            <label htmlFor="dropoff_detail" className="label">
              Zielnummer (optional)
            </label>
            <input
              id="dropoff_detail"
              type="text"
              className="input"
              placeholder="z. B. B20 Dock B"
              maxLength={20}
              value={form.dropoff_detail}
              onChange={(e) => setForm((f) => ({ ...f, dropoff_detail: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="passengers" className="label">
              Anzahl Mitfahrende (inkl. Sie)
            </label>
            <input
              id="passengers"
              type="number"
              min={1}
              max={16}
              className="input"
              value={form.passengers}
              onChange={(e) => setForm((f) => ({ ...f, passengers: e.target.value }))}
              required
            />
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            disabled={submitting || !form.pickup_zone || !form.dropoff_zone}
            className="btn-primary w-full justify-center"
          >
            <Send size={15} />
            {submitting ? 'Wird gesendet…' : 'Fahrt anfordern'}
          </button>
        </form>
      </div>
    </div>
  )
}
