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
