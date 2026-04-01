import { useState, useCallback } from 'react'
import { RefreshCw, Car, Users, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import StatusBadge from '../components/shared/StatusBadge'
import { getDispatch } from '../utils/api'
import { usePolling } from '../hooks/usePolling'
import { ZONE_LABELS, STATUS_LABELS, formatTime } from '../utils/constants'

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function TaxiCard({ taxi }) {
  const free     = taxi.capacity - taxi.occupied
  const pct      = Math.round((taxi.occupied / taxi.capacity) * 100)
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-400' : 'bg-green-500'

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car size={18} className="text-gray-600" />
          <span className="font-semibold text-gray-900">{taxi.radio_id}</span>
        </div>
        <span className="text-xs text-gray-400">
          Zuletzt: {formatTime(taxi.last_seen)}
        </span>
      </div>

      <div className="text-sm text-gray-600">
        Standort: <span className="font-medium text-gray-900">
          {taxi.position} – {ZONE_LABELS[taxi.position] ?? '?'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1"><Users size={12} /> Belegung</span>
          <span>{taxi.occupied}/{taxi.capacity} ({free} frei)</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function DispatchPage() {
  const [data,  setData]  = useState(null)
  const [error, setError] = useState(null)
  const [ts,    setTs]    = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await getDispatch()
      setData(res)
      setTs(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  usePolling(load, 10000, true)

  const stats    = data?.stats ?? {}
  const taxis    = data?.taxis ?? []
  const open     = data?.open_trips ?? []
  const recent   = data?.recent ?? []

  const totalToday    = Object.values(stats).reduce((s, v) => s + (v.total || 0), 0)
  const pendingCount  = stats.pending?.total ?? 0
  const completedCount= stats.completed?.total ?? 0
  const totalPax      = Object.values(stats).reduce((s, v) => s + (v.passengers || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Disposition</h1>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RefreshCw size={12} />
          {ts ? `Aktualisiert: ${formatTime(ts.toISOString())}` : 'Wird geladen…'}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* Statistiken */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Auftraege heute" value={totalToday} />
        <StatCard
          label="Ausstehend"
          value={pendingCount}
          color={pendingCount > 0 ? 'text-yellow-600' : 'text-gray-900'}
        />
        <StatCard label="Abgeschlossen" value={completedCount} color="text-green-600" />
        <StatCard label="Personen bef." value={totalPax} />
      </div>

      {/* Taxis */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Aktive Taxis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {taxis.length === 0 && (
            <div className="card p-6 text-center text-gray-400 text-sm col-span-2">
              Keine aktiven Taxis angemeldet
            </div>
          )}
          {taxis.map((t) => <TaxiCard key={t.id} taxi={t} />)}
        </div>
      </section>

      {/* Offene Auftraege */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Offene Auftraege ({open.length})
        </h2>
        <div className="card divide-y divide-gray-100">
          {open.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">
              Keine offenen Auftraege
            </div>
          )}
          {open.map((trip) => (
            <div key={trip.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <span className="font-medium">
                  {trip.pickup_zone}{trip.pickup_detail ? ` (${trip.pickup_detail})` : ''}
                  {' '}&rarr;{' '}
                  {trip.dropoff_zone}{trip.dropoff_detail ? ` (${trip.dropoff_detail})` : ''}
                </span>
                <span className="ml-2 text-gray-500 text-xs">
                  <Users size={11} className="inline mr-0.5" />
                  {trip.passengers} Pax
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {trip.taxi_radio_id && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Car size={11} />
                    {trip.taxi_radio_id}
                  </span>
                )}
                <StatusBadge status={trip.status} overflow={trip.overflow_warning} />
                {trip.overflow_warning == 1 && (
                  <AlertTriangle size={14} className="text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verlauf */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Letzte Fahrten
        </h2>
        <div className="card divide-y divide-gray-100">
          {recent.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">Noch keine Fahrten</div>
          )}
          {recent.map((trip) => (
            <div key={trip.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {trip.status === 'completed'
                  ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                  : trip.status === 'cancelled'
                  ? <XCircle size={14} className="text-gray-400 shrink-0" />
                  : <Clock size={14} className="text-yellow-500 shrink-0" />}
                <span>
                  {trip.pickup_zone} &rarr; {trip.dropoff_zone}
                  <span className="ml-1 text-gray-500">
                    ({trip.passengers} Pax)
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                {trip.taxi_radio_id && (
                  <span className="flex items-center gap-1">
                    <Car size={11} />
                    {trip.taxi_radio_id}
                  </span>
                )}
                <span>{formatTime(trip.requested_at)}</span>
                <StatusBadge status={trip.status} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
