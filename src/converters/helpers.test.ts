import { describe, expect, it } from 'vitest'
import {
  assertFileSize,
  formatBytes,
  isHeicFile,
  isZipFile,
  MAX_FILE_BYTES,
  replaceExtension,
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
})

describe('formatBytes', () => {
  it('formats bytes, KB, and MB', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1023)).toBe('1023 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1048576)).toBe('1.0 MB')
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
