interface ResizePreset {
  label: string
  value: number
}

const PRESETS: ResizePreset[] = [
  { label: 'Original', value: 0 },
  { label: 'Small', value: 800 },
  { label: 'Medium', value: 1280 },
  { label: 'Large', value: 1920 },
]

interface ResizePickerProps {
  value: number
  onChange: (value: number) => void
}

export function ResizePicker({ value, onChange }: ResizePickerProps) {
  return (
    <div className="picker">
      <span className="picker-label">Size</span>
      <div className="picker-options" role="group" aria-label="Image size">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={preset.value === value ? 'picker-option active' : 'picker-option'}
            aria-pressed={preset.value === value}
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
            {preset.value > 0 && <span className="picker-option-value">{preset.value}px</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
