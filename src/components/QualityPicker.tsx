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
      <div className="picker-options" role="group" aria-label="Image quality">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={preset.value === value ? 'picker-option active' : 'picker-option'}
            aria-pressed={preset.value === value}
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
            <span className="picker-option-value">{Math.round(preset.value * 100)}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}
