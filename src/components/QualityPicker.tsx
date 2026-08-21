interface QualityPreset {
  label: string
  value: number
}

const PRESETS: QualityPreset[] = [
  { label: 'Small', value: 0.5 },
  { label: 'Balanced', value: 0.8 },
  { label: 'High', value: 0.9 },
]

interface QualityPickerProps {
  value: number
  onChange: (value: number) => void
}

export function QualityPicker({ value, onChange }: QualityPickerProps) {
  return (
    <div className="quality">
      <span className="quality-label">Quality</span>
      <div className="quality-options" role="group" aria-label="JPEG quality">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={preset.value === value ? 'quality-option active' : 'quality-option'}
            aria-pressed={preset.value === value}
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
            <span className="quality-option-value">{Math.round(preset.value * 100)}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}
