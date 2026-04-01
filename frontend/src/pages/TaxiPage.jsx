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
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Taxi anmelden</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="btn-primary w-full justify-center"
          >
            <LogIn size={15} />
            {loading ? 'Wird angemeldet…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---- Auftragsliste ----
function TripCard({ trip, taxi, onAccept, onComplete, accepting, completing }) {
  const [dropoffPos, setDropoffPos] = useState(trip.dropoff_zone)

  return (
    <div className={`card p-4 space-y-3 ${trip.overflow_warning ? 'border-red-300' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm space-y-0.5">
          <div className="font-medium">
            {trip.pickup_zone} – {ZONE_LABELS[trip.pickup_zone]}
            {trip.pickup_detail && ` (${trip.pickup_detail})`}
            {' '}&rarr;{' '}
            {trip.dropoff_zone} – {ZONE_LABELS[trip.dropoff_zone]}
            {trip.dropoff_detail && ` (${trip.dropoff_detail})`}
          </div>
          <div className="text-gray-500 flex items-center gap-2 text-xs">
            <Users size={12} />
            {trip.passengers} Person{trip.passengers !== 1 ? 'en' : ''}
            <span className="text-gray-300">|</span>
            {formatTime(trip.requested_at)}
          </div>
        </div>
        <StatusBadge status={trip.status} overflow={trip.overflow_warning} />
      </div>

      {trip.overflow_warning == 1 && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle size={13} />
          Kapazitaet ueberschritten — bewusste Uebernahme
        </div>
      )}

      {trip.status === 'pending' && (
        <button
          className="btn-primary text-xs h-8"
          disabled={accepting}
          onClick={() => onAccept(trip.id)}
        >
          <CheckCircle size={13} />
          {accepting ? 'Wird angenommen…' : 'Auftrag annehmen'}
        </button>
      )}

      {(trip.status === 'accepted' || trip.status === 'in_progress') && taxi.id === trip.taxi_id_num && (
        <div className="space-y-2">
          <ZoneSelect
            id={`complete_pos_${trip.id}`}
            label="Abgabeort bestaetigen"
            value={dropoffPos}
            onChange={setDropoffPos}
            required={false}
          />
          <button
            className="btn-success text-xs h-8 w-full justify-center"
            disabled={completing}
            onClick={() => onComplete(trip.id, dropoffPos)}
          >
            <MapPin size={13} />
            {completing ? 'Wird abgeschlossen…' : 'Abgeschlossen — Passagiere abgesetzt'}
          </button>
        </div>
      )}
    </div>
  )
}

// ---- Hauptansicht ----
export default function TaxiPage() {
  const [taxi,      setTaxi]      = useState(null)
  const [trips,     setTrips]     = useState([])
  const [error,     setError]     = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [completing,setCompleting]= useState(false)
  const [posMode,   setPosMode]   = useState(false)
  const [newPos,    setNewPos]    = useState('')

  const fetchTrips = useCallback(async () => {
    if (!taxi) return
    try {
      const pending  = await getTrips({ status: 'pending',  taxi_id: taxi.id })
      const accepted = await getTrips({ status: 'accepted', taxi_id: taxi.id })
      // Eigene angenommene Auftraege obenan, dann offene priorisiert
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

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Taxi-Header */}
      <div className="card p-4 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="font-semibold text-gray-900">Funknummer: {taxi.radio_id}</div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {taxi.position} – {ZONE_LABELS[taxi.position]}
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {taxi.occupied ?? 0}/{taxi.capacity} Pax
              {freeSeats > 0
                ? <span className="text-green-600 ml-1">({freeSeats} frei)</span>
                : <span className="text-red-600 ml-1">(voll)</span>}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs h-8" onClick={() => setPosMode((v) => !v)}>
            <MapPin size={13} />
            Standort
          </button>
          <button className="btn-danger text-xs h-8" onClick={handleLogout}>
            <LogOut size={13} />
            Abmelden
          </button>
        </div>
      </div>

      {/* Standort-Update */}
      {posMode && (
        <form onSubmit={handleUpdatePosition} className="card p-4 space-y-3">
          <ZoneSelect
            id="update_pos"
            label="Neuer Standort"
            value={newPos}
            onChange={setNewPos}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={!newPos} className="btn-primary text-xs h-8">
              Bestaetigen
            </button>
            <button type="button" className="btn-secondary text-xs h-8" onClick={() => setPosMode(false)}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <ErrorMessage message={error} />

      {/* Auftragsliste */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">
            Auftraege ({trips.length})
          </h3>
          <button className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700" onClick={fetchTrips}>
            <RefreshCw size={12} />
            Aktualisieren
          </button>
        </div>

        {trips.length === 0 && (
          <div className="card p-8 text-center text-gray-400 text-sm">
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
