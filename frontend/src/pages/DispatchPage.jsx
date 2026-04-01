import { useState, useCallback } from 'react'
import { RefreshCw, Car, Users, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import StatusBadge from '../components/shared/StatusBadge'
import { getDispatch } from '../utils/api'
import { usePolling } from '../hooks/usePolling'
import { ZONE_LABELS, STATUS_LABELS, formatTime } from '../utils/constants'

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-3xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1 font-medium">{label}</div>
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Car size={20} className="text-gray-600 shrink-0" />
          <span className="font-bold text-gray-900 text-lg">{taxi.radio_id}</span>
        </div>
        <span className="text-xs text-gray-400">
          {formatTime(taxi.last_seen)}
        </span>
      </div>

      <div className="text-sm text-gray-600">
        Standort: <span className="font-semibold text-gray-900">
          {taxi.position} – {ZONE_LABELS[taxi.position] ?? '?'}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Users size={14} />
            Belegung
          </span>
          <span className="font-semibold text-gray-900">
            {taxi.occupied}/{taxi.capacity}
            <span className={`ml-1.5 ${free > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({free > 0 ? `${free} frei` : 'voll'})
            </span>
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Disposition</h1>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <RefreshCw size={12} />
          {ts ? formatTime(ts.toISOString()) : 'Wird geladen…'}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm rounded-lg bg-red-50 border border-red-200 px-3 py-3">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Statistiken — 2x2 auf Klein, 4er-Reihe ab sm */}
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
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Aktive Taxis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {taxis.length === 0 && (
            <div className="card p-6 text-center text-gray-400 text-sm sm:col-span-2">
              Keine aktiven Taxis angemeldet
            </div>
          )}
          {taxis.map((t) => <TaxiCard key={t.id} taxi={t} />)}
        </div>
      </section>

      {/* Offene Auftraege */}
      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Offene Auftraege ({open.length})
        </h2>
        <div className="card divide-y divide-gray-100">
          {open.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">
              Keine offenen Auftraege
            </div>
          )}
          {open.map((trip) => (
            <div key={trip.id} className="px-4 py-3.5 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-900">
                    {trip.pickup_zone}{trip.pickup_detail ? ` (${trip.pickup_detail})` : ''}
                    {' '}&rarr;{' '}
                    {trip.dropoff_zone}{trip.dropoff_detail ? ` (${trip.dropoff_detail})` : ''}
                  </span>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      {trip.passengers} Pax
                    </span>
                    {trip.taxi_radio_id && (
                      <span className="flex items-center gap-1">
                        <Car size={13} />
                        {trip.taxi_radio_id}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {trip.overflow_warning == 1 && (
                    <AlertTriangle size={15} className="text-red-500" />
                  )}
                  <StatusBadge status={trip.status} overflow={trip.overflow_warning} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verlauf */}
      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Letzte Fahrten
        </h2>
        <div className="card divide-y divide-gray-100">
          {recent.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">Noch keine Fahrten</div>
          )}
          {recent.map((trip) => (
            <div key={trip.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {trip.status === 'completed'
                  ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                  : trip.status === 'cancelled'
                  ? <XCircle size={16} className="text-gray-400 shrink-0" />
                  : <Clock size={16} className="text-yellow-500 shrink-0" />}
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm">
                    {trip.pickup_zone} &rarr; {trip.dropoff_zone}
                    <span className="text-gray-500 font-normal ml-1">({trip.passengers} Pax)</span>
                  </div>
                  {trip.taxi_radio_id && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Car size={11} />
                      {trip.taxi_radio_id}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusBadge status={trip.status} />
                <span className="text-xs text-gray-400">{formatTime(trip.requested_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
