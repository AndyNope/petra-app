// Geordnete Platzkürzel entsprechend dem Algorithmus im Backend
export const ZONES = ['E', 'F', 'H', 'I', 'A', 'B', 'C', 'D', 'T', 'G', 'P', 'W']

export const ZONE_LABELS = {
  E: 'Echo',
  F: 'Foxtrot',
  H: 'Hotel',
  I: 'India',
  A: 'Alpha',
  B: 'Bravo',
  C: 'Charlie',
  D: 'Delta',
  T: 'Tango',
  G: 'Golf',
  P: 'Papa',
  W: 'Whisky',
}

export const STATUS_LABELS = {
  pending:    'Ausstehend',
  accepted:   'Angenommen',
  in_progress:'Unterwegs',
  completed:  'Abgeschlossen',
  cancelled:  'Storniert',
}

export const STATUS_BADGE = {
  pending:    'badge-pending',
  accepted:   'badge-accepted',
  in_progress:'badge-progress',
  completed:  'badge-completed',
  cancelled:  'badge-cancelled',
}

export function formatTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Fahrstrecken in km zwischen allen 12 Vorfeld-Plätzen (ZRH).
 *
 * Berechnet aus der Flughafen-Karte (Maßstab 1 km) mit einem
 * Strassenfaktor × 1.25 (Taxiways/Rollwege sind selten eine Gerade).
 *
 * Koordinaten-Referenzpunkte (km, Alpha = Ursprung):
 *   E (-1.2 / +0.4)  — Dock E, weit westlich
 *   F (+1.1 / +0.5)  — Foxtrot / Cargo nordöstlich
 *   H (+0.4 / +0.7)  — Hotel-Stände nördlich
 *   I (-0.4 / +0.7)  — India-Stände nordwestlich
 *   A ( 0.0 /  0.0)  — Alpha / Dock A, Zentrum
 *   B ( 0.0 / -0.3)  — Bravo / Dock B, südlich
 *   C (-0.1 / -0.7)  — Charlie, süd
 *   D (+0.3 / -0.9)  — Delta, süd
 *   T (+0.9 / -0.7)  — Tango, südost
 *   G (+0.2 / -1.2)  — Golf, weit südlich
 *   P (+0.8 / -0.4)  — Papa / Parkhaus, ostseite
 *   W (-0.7 / -0.2)  — Whisky, westlich (Heliport-Nähe)
 */
export const ZONE_DISTANCES = {
//    E    F    H    I    A    B    C    D    T    G    P    W
  E:{ E:0.0,F:2.9,H:2.0,I:1.1,A:1.6,B:1.7,C:1.9,D:2.5,T:3.0,G:2.7,P:2.7,W:1.0 },
  F:{ E:2.9,F:0.0,H:0.9,I:1.9,A:1.5,B:1.7,C:2.1,D:2.0,T:1.5,G:2.4,P:1.2,W:2.4 },
  H:{ E:2.0,F:0.9,H:0.0,I:1.0,A:1.0,B:1.3,C:1.9,D:2.0,T:1.9,G:2.4,P:1.5,W:1.8 },
  I:{ E:1.1,F:1.9,H:1.0,I:0.0,A:1.0,B:1.3,C:1.8,D:2.2,T:2.4,G:2.5,P:2.0,W:1.2 },
  A:{ E:1.6,F:1.5,H:1.0,I:1.0,A:0.0,B:0.4,C:0.9,D:1.2,T:1.4,G:1.5,P:1.1,W:0.9 },
  B:{ E:1.7,F:1.7,H:1.3,I:1.3,A:0.4,B:0.0,C:0.5,D:0.8,T:1.2,G:1.2,P:1.0,W:0.9 },
  C:{ E:1.9,F:2.1,H:1.9,I:1.8,A:0.9,B:0.5,C:0.0,D:0.6,T:1.3,G:0.7,P:1.2,W:1.0 },
  D:{ E:2.5,F:2.0,H:2.0,I:2.2,A:1.2,B:0.8,C:0.6,D:0.0,T:0.8,G:0.4,P:0.9,W:1.5 },
  T:{ E:3.0,F:1.5,H:1.9,I:2.4,A:1.4,B:1.2,C:1.3,D:0.8,T:0.0,G:1.1,P:0.4,W:2.1 },
  G:{ E:2.7,F:2.4,H:2.4,I:2.5,A:1.5,B:1.2,C:0.7,D:0.4,T:1.1,G:0.0,P:1.3,W:1.7 },
  P:{ E:2.7,F:1.2,H:1.5,I:2.0,A:1.1,B:1.0,C:1.2,D:0.9,T:0.4,G:1.3,P:0.0,W:1.9 },
  W:{ E:1.0,F:2.4,H:1.8,I:1.2,A:0.9,B:0.9,C:1.0,D:1.5,T:2.1,G:1.7,P:1.9,W:0.0 },
}

/**
 * Schätzt die Fahrzeit in Minuten zwischen zwei Plätzen.
 * F ↔ E: 50 km/h (langer Taxiway-Abschnitt, erlaubt höheres Tempo).
 * Alle anderen Verbindungen: 30 km/h (Standardgeschwindigkeit Vorfeld).
 * Ergebnis wird aufgerundet; minimum 1 min (ausser gleicher Platz = 0).
 */
export function travelMinutes(from, to) {
  if (!from || !to) return null
  if (from === to) return 0
  const dist = ZONE_DISTANCES[from]?.[to]
  if (dist == null) return null
  const isHighSpeed = (from === 'E' && to === 'F') || (from === 'F' && to === 'E')
  const speedKmh = isHighSpeed ? 50 : 30
  return Math.max(1, Math.ceil((dist / speedKmh) * 60))
}
