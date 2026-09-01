import { describe, expect, it } from 'vitest'
import {
  assertFileSize,
  assertImageDimensions,
  formatBytes,
  formatSizeSavings,
  isHeicFile,
  isZipFile,
  MAX_FILE_BYTES,
  MAX_IMAGE_DIMENSION,
  replaceExtension,
  sanitizeFilename,
  scaledSize,
} from './helpers'

describe('replaceExtension', () => {
  it('replaces an existing extension', () => {
    expect(replaceExtension('photo.jpg', 'png')).toBe('photo.png')
  })

  it('handles multiple dots', () => {
    expect(replaceExtension('a.b.c', 'x')).toBe('a.b.x')
  })

  it('appends an extension when there is none', () => {
    expect(replaceExtension('noext', 'png')).toBe('noext.png')
  })

  it('sanitizes path traversal in the filename', () => {
    expect(replaceExtension('../evil', 'jpg')).toBe('evil.jpg')
    expect(replaceExtension('..\\..\\win', 'csv')).toBe('win.csv')
  })
})

describe('sanitizeFilename', () => {
  it('strips path traversal segments', () => {
    expect(sanitizeFilename('../evil')).toBe('evil')
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd')
    expect(sanitizeFilename('/absolute/path/name')).toBe('name')
  })

  it('strips Windows-style backslash separators', () => {
    expect(sanitizeFilename('..\\..\\win')).toBe('win')
  })

  it('removes control characters', () => {
    expect(sanitizeFilename('bad\u0000\u001fname')).toBe('badname')
  })

  it('falls back to a safe name when the result is empty', () => {
    expect(sanitizeFilename('..')).toBe('file')
    expect(sanitizeFilename('')).toBe('file')
  })
})

describe('formatBytes', () => {
  it('formats bytes, KB, and MB', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1023)).toBe('1023 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1048576)).toBe('1.0 MB')
  })
})

describe('formatSizeSavings', () => {
  it('returns null when there is no meaningful source size', () => {
    expect(formatSizeSavings(0, 10)).toBeNull()
    expect(formatSizeSavings(-1, 10)).toBeNull()
  })

  it('shows a negative percentage when the output is smaller', () => {
    expect(formatSizeSavings(1_000_000, 100_000)).toBe('-90%')
  })

  it('shows a positive percentage when the output is larger', () => {
    expect(formatSizeSavings(100_000, 1_000_000)).toBe('+900%')
  })

  it('shows 0% for negligible changes', () => {
    expect(formatSizeSavings(1000, 1004)).toBe('0%')
  })

  it('rounds percentages to whole numbers', () => {
    expect(formatSizeSavings(1000, 666)).toBe('-33%')
  })
})

describe('isHeicFile', () => {
  function buffer(...bytes: number[]): ArrayBuffer {
    return new Uint8Array(bytes).buffer
  }

  it('detects an ftyp signature at the correct offset', () => {
    const bytes = new Uint8Array(12)
    bytes.set([0x66, 0x74, 0x79, 0x70], 4)
    expect(isHeicFile(bytes.buffer)).toBe(true)
  })

  it('rejects buffers shorter than 12 bytes', () => {
    expect(isHeicFile(buffer(1, 2, 3))).toBe(false)
  })

  it('rejects a non-HEIC signature', () => {
    const bytes = new Uint8Array(12).fill(0)
    expect(isHeicFile(bytes.buffer)).toBe(false)
  })
})

describe('isZipFile', () => {
  it('detects the PK signature', () => {
    expect(isZipFile(new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer)).toBe(true)
  })

  it('rejects buffers shorter than 2 bytes', () => {
    expect(isZipFile(new Uint8Array([0x50]).buffer)).toBe(false)
  })

  it('rejects a non-zip signature', () => {
    expect(isZipFile(new Uint8Array([0x00, 0x01, 0x02]).buffer)).toBe(false)
  })
})

describe('scaledSize', () => {
  it('returns the original size when maxDimension is 0', () => {
    expect(scaledSize(4000, 3000, 0)).toEqual({ width: 4000, height: 3000 })
  })

  it('returns the original size when already within the limit', () => {
    expect(scaledSize(800, 600, 1000)).toEqual({ width: 800, height: 600 })
  })

  it('scales down proportionally to the max dimension', () => {
    expect(scaledSize(4000, 3000, 1000)).toEqual({ width: 1000, height: 750 })
  })

  it('scales by height when it is the longest side', () => {
    expect(scaledSize(3000, 4000, 1000)).toEqual({ width: 750, height: 1000 })
  })

  it('never scales below 1px', () => {
    expect(scaledSize(2, 2, 1)).toEqual({ width: 1, height: 1 })
  })

  it('scales down very large dimensions without overflow', () => {
    expect(scaledSize(100000, 80000, 4096)).toEqual({ width: 4096, height: 3277 })
  })

  it('returns zero dimensions unchanged', () => {
    expect(scaledSize(0, 0, 1000)).toEqual({ width: 0, height: 0 })
  })
})

describe('assertFileSize', () => {
  it('allows files at or under the limit', () => {
    expect(() => assertFileSize({ size: MAX_FILE_BYTES })).not.toThrow()
    expect(() => assertFileSize({ size: 0 })).not.toThrow()
  })

  it('rejects files over the limit with a hint', () => {
    try {
      assertFileSize({ size: MAX_FILE_BYTES + 1, name: 'big.heic' })
      expect.unreachable()
    } catch (err) {
      expect((err as Error).name).toBe('ConversionError')
      expect((err as Error).message).toContain('over the 100 MB limit')
      expect((err as { hint?: string }).hint).toBeTruthy()
    }
  })
})

describe('assertImageDimensions', () => {
  it('allows images at or under the dimension limit', () => {
    expect(() => assertImageDimensions(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION)).not.toThrow()
    expect(() => assertImageDimensions(100, 100)).not.toThrow()
  })

  it('rejects images exceeding the dimension limit with a hint', () => {
    try {
      assertImageDimensions(20000, 100, 'huge.png')
      expect.unreachable()
    } catch (err) {
      expect((err as Error).name).toBe('ConversionError')
      expect((err as Error).message).toContain('too large')
      expect((err as { hint?: string }).hint).toBeTruthy()
    }
  })
})
