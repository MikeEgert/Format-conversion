import type { ConversionResult } from './types'

export function replaceExtension(filename: string, newExt: string): string {
  const i = filename.lastIndexOf('.')
  const base = i > 0 ? filename.slice(0, i) : filename
  return `${base}.${newExt}`
}

export function downloadResult(result: ConversionResult): void {
  const url = URL.createObjectURL(result.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isHeicFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) return false
  const bytes = new Uint8Array(buffer, 0, 12)
  return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
}

export function isZipFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) return false
  const bytes = new Uint8Array(buffer, 0, 2)
  return bytes[0] === 0x50 && bytes[1] === 0x4b
}

export function scaledSize(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (maxDimension <= 0) return { width, height }
  const longest = Math.max(width, height)
  if (longest <= maxDimension) return { width, height }
  const scale = maxDimension / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export async function resizeImage(
  blob: Blob,
  maxDimension: number,
  mime: string,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = scaledSize(bitmap.width, bitmap.height, maxDimension)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas is not available in this browser.')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality))
  if (!out) throw new Error('Could not encode the resized image.')
  return out
}
