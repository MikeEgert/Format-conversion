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
      <div className="picker-select">
        <select
          value={value}
          aria-label="Image size"
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {PRESETS.map((preset) => (
            <option key={preset.label} value={preset.value}>
              {preset.value > 0 ? `${preset.label} · ${preset.value}px` : preset.label}
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