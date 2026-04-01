import { ZONES, ZONE_LABELS } from '../../utils/constants'

export default function ZoneSelect({ id, value, onChange, label, required = true }) {
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="input"
      >
        <option value="">Platz waehlen…</option>
        {ZONES.map((z) => (
          <option key={z} value={z}>
            {z} – {ZONE_LABELS[z]}
          </option>
        ))}
      </select>
    </div>
  )
}
