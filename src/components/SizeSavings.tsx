import { formatBytes, formatSizeSavings } from '../converters/helpers'

interface SizeSavingsProps {
  sourceSize: number
  outputSize: number
}

export function SizeSavings({ sourceSize, outputSize }: SizeSavingsProps) {
  if (!(sourceSize > 0)) return null

  const label = formatSizeSavings(sourceSize, outputSize)
  const delta = outputSize - sourceSize
  const saved = delta < 0
  const title =
    delta < 0
      ? `Saved ${formatBytes(-delta)}`
      : delta > 0
        ? `Larger by ${formatBytes(delta)}`
        : 'Same size'

  return (
    <span
      className={`size-savings ${saved ? 'size-savings-saved' : delta > 0 ? 'size-savings-grew' : ''}`}
      title={title}
    >
      {label}
    </span>
  )
}
