import { ZONES, ZONE_LABELS } from '../../utils/constants'

/**
 * Touch-freundliche Zonenauswahl als Button-Grid.
 * Kein Dropdown-Scroll — jeder Platz ist direkt tippbar.
 */
export default function ZoneSelect({ id, value, onChange, label, required = true }) {
  return (
    <div>
      {label && (
        <span id={`${id}-label`} className="label">
          {label}
        </span>
      )}

      <div
        role="group"
        aria-labelledby={label ? `${id}-label` : undefined}
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
      >
        {ZONES.map((z) => {
          const selected = value === z
          return (
            <button
              key={z}
              type="button"
              onClick={() => onChange(selected ? '' : z)}
              aria-pressed={selected}
              className={[
                'flex flex-col items-center justify-center rounded-xl py-3 px-1 min-h-[60px]',
                'border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
                'active:scale-95 select-none',
                selected
                  ? 'bg-blue-700 border-blue-800 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50',
              ].join(' ')}
            >
              <span className="text-xl font-bold leading-none">{z}</span>
              <span className={`text-[10px] leading-tight mt-1 font-medium ${selected ? 'text-blue-100' : 'text-gray-400'}`}>
                {ZONE_LABELS[z]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Unsichtbares Pflichtfeld damit Browser-Validation greift */}
      {required && (
        <input
          type="text"
          required
          value={value}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          style={{ opacity: 0, height: 0, padding: 0, margin: 0, border: 0, display: 'block' }}
        />
      )}
    </div>
  )
}
