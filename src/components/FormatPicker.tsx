import type { ImageFormat, ImageFormatOption } from '../converters/types'

interface FormatPickerProps {
  formats: ImageFormatOption[]
  value: ImageFormat
  onChange: (format: ImageFormat) => void
}

export function FormatPicker({ formats, value, onChange }: FormatPickerProps) {
  return (
    <div className="picker">
      <span className="picker-label">Convert to</span>
      <div className="picker-options" role="group" aria-label="Output format">
        {formats.map((format) => (
          <button
            key={format.id}
            type="button"
            className={format.id === value ? 'picker-option active' : 'picker-option'}
            aria-pressed={format.id === value}
            onClick={() => onChange(format.id)}
          >
            {format.label}
          </button>
        ))}
      </div>
    </div>
  )
}
