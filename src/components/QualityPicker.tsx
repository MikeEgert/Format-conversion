interface QualityPreset {
  label: string
  value: number
}

const PRESETS: QualityPreset[] = [
  { label: 'Very low', value: 0.3 },
  { label: 'Low', value: 0.5 },
  { label: 'Balanced', value: 0.8 },
  { label: 'High', value: 0.9 },
]

interface QualityPickerProps {
  value: number
  onChange: (value: number) => void
}

export function QualityPicker({ value, onChange }: QualityPickerProps) {
  return (
    <div className="picker">
      <span className="picker-label">Quality</span>
      <div className="picker-select">
        <select
          value={value}
          aria-label="Image quality"
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {PRESETS.map((preset) => (
            <option key={preset.label} value={preset.value}>
              {preset.label} · {Math.round(preset.value * 100)}%
            </option>
          ))}
        </select>
        <svg className="picker-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}