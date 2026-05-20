import { STATUS_LABELS, STATUS_BADGE } from '../../utils/constants'

export default function StatusBadge({ status, overflow }) {
  const cls   = STATUS_BADGE[status] ?? 'badge bg-gray-100 text-gray-600'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span className="inline-flex items-center gap-1">
      <span className={cls}>{label}</span>
      {overflow && <span className="badge-warning">Kapazitaet ueberschritten</span>}
    </span>
  )
}
