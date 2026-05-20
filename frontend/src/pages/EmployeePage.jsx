import { useState, useCallback } from 'react'
import { Send, RefreshCw, CheckCircle, Clock, MapPin, Car, Timer } from 'lucide-react'
import ZoneSelect from '../components/shared/ZoneSelect'
import StatusBadge from '../components/shared/StatusBadge'
import ErrorMessage from '../components/shared/ErrorMessage'
import { createTrip, getTrip } from '../utils/api'
import { usePolling } from '../hooks/usePolling'
import { ZONE_LABELS, formatTime, travelMinutes } from '../utils/constants'

const FORM_INITIAL = {
  pickup_zone: '',
  pickup_detail: '',
  dropoff_zone: '',
  dropoff_detail: '',
  passengers: 1,
}

export default function EmployeePage() {
  const [form, setForm]           = useState(FORM_INITIAL)
  const [submitting, setSub]      = useState(false)
  const [error, setError]         = useState(null)
  const [trip, setTrip]           = useState(null)
  const [lastRefresh, setRefresh] = useState(null)

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }))

  function stepPassengers(delta) {
    setForm((f) => ({
      ...f,
      passengers: Math.min(16, Math.max(1, (f.passengers || 1) + delta)),
    }))
  }

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

  const refresh = useCallback(async () => {
    if (!trip?.id) return
    try {
      const updated = await getTrip(trip.id)
      setTrip(updated)
      setRefresh(new Date())
    } catch { /* polling weiter */ }
  }, [trip?.id])

  usePolling(refresh, 10000, !!trip?.id)

  function handleNewRequest() {
    setTrip(null)
    setForm(FORM_INITIAL)
    setError(null)
  }

  /* --- Status-Ansicht nach Absenden --- */
  if (trip) {
    const isTerminal = ['completed', 'cancelled'].includes(trip.status)

    // ETA berechnen wenn Taxi-Position bekannt (kommt via API-Join)
    const etaMin = trip.status === 'accepted' && trip.taxi_position
      ? travelMinutes(trip.taxi_position, trip.pickup_zone)
      : null

    let statusIcon, statusBg, statusText
    if (trip.status === 'pending') {
      statusIcon = <Clock size={28} className="text-yellow-600" />
      statusBg   = 'bg-yellow-50 border-yellow-200'
      statusText = 'Warte auf Taxifahrer…'
    } else if (trip.status === 'accepted') {
      statusIcon = <Car size={28} className="text-blue-600" />
      statusBg   = 'bg-blue-50 border-blue-200'
      statusText = 'Taxi ist unterwegs zu Ihnen.'
    } else if (trip.status === 'in_progress') {
      statusIcon = <MapPin size={28} className="text-indigo-600" />
      statusBg   = 'bg-indigo-50 border-indigo-200'
      statusText = 'Fahrt laeuft.'
    } else if (trip.status === 'completed') {
      statusIcon = <CheckCircle size={28} className="text-green-600" />
      statusBg   = 'bg-green-50 border-green-200'
      statusText = 'Fahrt abgeschlossen. Vielen Dank!'
    } else {
      statusIcon = null
      statusBg   = 'bg-gray-50 border-gray-200'
      statusText = 'Auftrag storniert.'
    }

    return (
      <div className="max-w-lg mx-auto space-y-4">
        {/* Status-Banner — gross und klar lesbar */}
        {!isTerminal && (
          <div className={`card border p-5 flex items-center gap-4 ${statusBg}`}>
            {statusIcon}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-base">{statusText}</div>

              {/* ETA wenn Taxi-Position vom Server bekannt */}
              {etaMin !== null && (
                <div className="flex items-center gap-1.5 mt-1.5 font-bold text-blue-700 text-base">
                  <Timer size={16} />
                  {etaMin === 0
                    ? 'Taxi ist bereits an Ihrem Standort.'
                    : `Eintreffen in ca. ${etaMin} Minute${etaMin !== 1 ? 'n' : ''}`}
                </div>
              )}

              {!isTerminal && (
                <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                  <RefreshCw size={12} />
                  Aktualisierung alle 10 Sekunden
                  {lastRefresh && ` — ${formatTime(lastRefresh.toISOString())}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auftragsdetails */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Ihr Auftrag</h2>
            <StatusBadge status={trip.status} overflow={trip.overflow_warning} />
          </div>

          <div className="space-y-3">
            {/* Abholort — grosse Kachel */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
              <div className="text-xs text-gray-500 mb-0.5">Abholort</div>
              <div className="font-semibold text-gray-900 text-base">
                {trip.pickup_zone} – {ZONE_LABELS[trip.pickup_zone]}
              </div>
              {trip.pickup_detail && (
                <div className="text-sm text-gray-600">{trip.pickup_detail}</div>
              )}
            </div>

            {/* Zielort */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
              <div className="text-xs text-gray-500 mb-0.5">Zielort</div>
              <div className="font-semibold text-gray-900 text-base">
                {trip.dropoff_zone} – {ZONE_LABELS[trip.dropoff_zone]}
              </div>
              {trip.dropoff_detail && (
                <div className="text-sm text-gray-600">{trip.dropoff_detail}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                <div className="text-xs text-gray-500 mb-0.5">Personen</div>
                <div className="font-semibold text-gray-900 text-base">{trip.passengers}</div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                <div className="text-xs text-gray-500 mb-0.5">Angefordert</div>
                <div className="font-semibold text-gray-900 text-sm">{formatTime(trip.requested_at)}</div>
              </div>
            </div>

            {trip.taxi_radio_id && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-3">
                <Car size={20} className="text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs text-blue-500">Zugewiesenes Taxi</div>
                  <div className="font-bold text-blue-900 text-lg">{trip.taxi_radio_id}</div>
                </div>
              </div>
            )}
          </div>

          {isTerminal && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${statusBg}`}>
              {statusIcon}
              <div className="font-semibold text-gray-800">{statusText}</div>
            </div>
          )}

          <button onClick={handleNewRequest} className="btn-secondary w-full">
            Neue Anfrage stellen
          </button>
        </div>
      </div>
    )
  }

  /* --- Anfrageformular --- */
  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Fahrt anfordern</h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Abholplatz */}
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

          {/* Zielort */}
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

          {/* Passagier-Stepper — grosse Buttons, kein Zahleneingabe-Zoom */}
          <div>
            <span className="label">Anzahl Mitfahrende (inkl. Sie)</span>
            <div className="flex items-center gap-4 mt-1">
              <button
                type="button"
                aria-label="Weniger"
                onClick={() => stepPassengers(-1)}
                disabled={form.passengers <= 1}
                className="btn-secondary w-14 h-14 text-2xl font-bold justify-center disabled:opacity-40"
              >
                −
              </button>
              <span className="flex-1 text-center text-3xl font-bold text-gray-900 tabular-nums">
                {form.passengers}
              </span>
              <button
                type="button"
                aria-label="Mehr"
                onClick={() => stepPassengers(1)}
                disabled={form.passengers >= 16}
                className="btn-secondary w-14 h-14 text-2xl font-bold justify-center disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            disabled={submitting || !form.pickup_zone || !form.dropoff_zone}
            className="btn-primary w-full"
          >
            <Send size={18} />
            {submitting ? 'Wird gesendet…' : 'Fahrt anfordern'}
          </button>
        </form>
      </div>
    </div>
  )
}
