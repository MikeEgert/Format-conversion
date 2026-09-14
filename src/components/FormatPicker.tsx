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
      <div className="picker-select">
        <select
          value={value}
          aria-label="Output format"
          onChange={(e) => onChange(e.target.value as ImageFormat)}
        >
          {formats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.label}
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