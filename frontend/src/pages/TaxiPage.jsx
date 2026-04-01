import { useState, useCallback, useEffect } from 'react'
import { LogIn, LogOut, CheckCircle, AlertTriangle, RefreshCw, MapPin, Users } from 'lucide-react'
import ZoneSelect from '../components/shared/ZoneSelect'
import StatusBadge from '../components/shared/StatusBadge'
import ErrorMessage from '../components/shared/ErrorMessage'
import { registerTaxi, deactivateTaxi, updateTaxiPosition, getTrips, acceptTrip, completeTrip } from '../utils/api'
import { usePolling } from '../hooks/usePolling'
import { ZONE_LABELS, formatTime } from '../utils/constants'

// ---- Anmeldeformular ----
function LoginForm({ onLogin }) {
  const [radioId,  setRadioId]  = useState('')
  const [position, setPosition] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const taxi = await registerTaxi({ radio_id: radioId.trim(), position })
      onLogin(taxi)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Taxi anmelden</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="radio" className="label">Funknummer</label>
            <input
              id="radio"
              type="text"
              className="input"
              placeholder="z. B. T1"
              value={radioId}
              onChange={(e) => setRadioId(e.target.value)}
              required
              maxLength={20}
              autoCapitalize="characters"
            />
          </div>
          <ZoneSelect
            id="start_pos"
            label="Aktueller Standort"
            value={position}
            onChange={setPosition}
          />
          <ErrorMessage message={error} />
          <button
            type="submit"
            disabled={loading || !radioId.trim() || !position}
            className="btn-primary w-full"
          >
            <LogIn size={18} />
            {loading ? 'Wird angemeldet…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---- Einzelner Auftrag ----
function TripCard({ trip, taxi, onAccept, onComplete, accepting, completing }) {
  const [dropoffPos, setDropoffPos] = useState(trip.dropoff_zone)
  const isOwn = taxi.id === trip.taxi_id_num

  return (
    <div className={`card p-4 space-y-4 ${trip.overflow_warning ? 'border-red-300 border-2' : ''}`}>
      {/* Route */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-base leading-tight">
            {trip.pickup_zone}
            <span className="text-gray-400 mx-1">–</span>
            {ZONE_LABELS[trip.pickup_zone]}
            {trip.pickup_detail && <span className="text-gray-500 font-normal"> ({trip.pickup_detail})</span>}
          </div>
          <div className="text-sm text-gray-500">
            &rarr; {trip.dropoff_zone} – {ZONE_LABELS[trip.dropoff_zone]}
            {trip.dropoff_detail && ` (${trip.dropoff_detail})`}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {trip.passengers} Person{trip.passengers !== 1 ? 'en' : ''}
            </span>
            <span className="text-gray-300">|</span>
            <span>{formatTime(trip.requested_at)}</span>
          </div>
        </div>
        <StatusBadge status={trip.status} overflow={trip.overflow_warning} />
      </div>

      {trip.overflow_warning == 1 && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-red-700 text-sm">
          <AlertTriangle size={16} />
          Kapazitaet ueberschritten — bewusste Uebernahme
        </div>
      )}

      {/* Annehmen-Button — volle Breite, gross */}
      {trip.status === 'pending' && (
        <button
          className="btn-primary w-full"
          disabled={accepting}
          onClick={() => onAccept(trip.id)}
        >
          <CheckCircle size={18} />
          {accepting ? 'Wird angenommen…' : 'Auftrag annehmen'}
        </button>
      )}

      {/* Abschliessen — nur eigene Auftraege */}
      {(trip.status === 'accepted' || trip.status === 'in_progress') && isOwn && (
        <div className="space-y-3">
          <ZoneSelect
            id={`complete_pos_${trip.id}`}
            label="Abgabeort bestaetigen"
            value={dropoffPos}
            onChange={setDropoffPos}
            required={false}
          />
          <button
            className="btn-success w-full"
            disabled={completing}
            onClick={() => onComplete(trip.id, dropoffPos)}
          >
            <MapPin size={18} />
            {completing ? 'Wird abgeschlossen…' : 'Abgeschlossen — Passagiere abgesetzt'}
          </button>
        </div>
      )}
    </div>
  )
}

// ---- Hauptansicht ----
export default function TaxiPage() {
  const [taxi,       setTaxi]      = useState(null)
  const [trips,      setTrips]     = useState([])
  const [error,      setError]     = useState(null)
  const [accepting,  setAccepting] = useState(false)
  const [completing, setCompleting]= useState(false)
  const [posMode,    setPosMode]   = useState(false)
  const [newPos,     setNewPos]    = useState('')

  const fetchTrips = useCallback(async () => {
    if (!taxi) return
    try {
      const pending  = await getTrips({ status: 'pending',  taxi_id: taxi.id })
      const accepted = await getTrips({ status: 'accepted', taxi_id: taxi.id })
      const ownAccepted = accepted.filter((t) => t.taxi_id === taxi.id)
      const enriched = [
        ...ownAccepted.map((t) => ({ ...t, taxi_id_num: taxi.id })),
        ...pending,
      ]
      setTrips(enriched)
    } catch { /* Netz-Fehler ignorieren beim Polling */ }
  }, [taxi])

  usePolling(fetchTrips, 10000, !!taxi)

  async function handleAccept(tripId) {
    setAccepting(true)
    setError(null)
    try {
      await acceptTrip(tripId, taxi.id)
      await fetchTrips()
    } catch (err) {
      setError(err.message)
    } finally {
      setAccepting(false)
    }
  }

  async function handleComplete(tripId, position) {
    setCompleting(true)
    setError(null)
    try {
      const result = await completeTrip(tripId, taxi.id, position)
      setTaxi((t) => ({ ...t, position, occupied: result.remaining_load }))
      await fetchTrips()
    } catch (err) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  async function handleUpdatePosition(e) {
    e.preventDefault()
    if (!newPos) return
    try {
      await updateTaxiPosition(taxi.id, newPos)
      setTaxi((t) => ({ ...t, position: newPos }))
      setPosMode(false)
      setNewPos('')
      await fetchTrips()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleLogout() {
    try { await deactivateTaxi(taxi.id) } catch { /* bereits inaktiv */ }
    setTaxi(null)
    setTrips([])
  }

  if (!taxi) return <LoginForm onLogin={(t) => setTaxi(t)} />

  const freeSeats = taxi.capacity - (taxi.occupied || 0)
  const pct = Math.round(((taxi.occupied || 0) / taxi.capacity) * 100)
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-400' : 'bg-green-500'

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Taxi-Header-Karte */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-bold text-gray-900 text-lg">{taxi.radio_id}</div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <MapPin size={14} />
              {taxi.position} – {ZONE_LABELS[taxi.position]}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {taxi.occupied ?? 0}<span className="text-base font-normal text-gray-400">/{taxi.capacity}</span>
            </div>
            <div className={`text-sm font-semibold ${freeSeats > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {freeSeats > 0 ? `${freeSeats} frei` : 'Voll'}
            </div>
          </div>
        </div>

        {/* Kapazitaetsbalken */}
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>

        {/* Aktionsbuttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button className="btn-secondary" onClick={() => setPosMode((v) => !v)}>
            <MapPin size={16} />
            Standort aendern
          </button>
          <button className="btn-danger" onClick={handleLogout}>
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </div>

      {/* Standort-Update */}
      {posMode && (
        <form onSubmit={handleUpdatePosition} className="card p-4 space-y-4">
          <ZoneSelect
            id="update_pos"
            label="Neuer Standort"
            value={newPos}
            onChange={setNewPos}
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="submit" disabled={!newPos} className="btn-primary">
              Bestaetigen
            </button>
            <button type="button" className="btn-secondary" onClick={() => setPosMode(false)}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <ErrorMessage message={error} />

      {/* Auftragsliste */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-gray-800">
            Auftraege ({trips.length})
          </h3>
          <button
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 py-2 px-3"
            onClick={fetchTrips}
          >
            <RefreshCw size={14} />
            Aktualisieren
          </button>
        </div>

        {trips.length === 0 && (
          <div className="card p-10 text-center text-gray-400">
            Keine offenen Auftraege
          </div>
        )}

        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            taxi={taxi}
            onAccept={handleAccept}
            onComplete={handleComplete}
            accepting={accepting}
            completing={completing}
          />
        ))}
      </div>
    </div>
  )
}
