import { describe, expect, it } from 'vitest'
import { readImageDimensions } from './imageHeaders'

function png(width: number, height: number): Uint8Array {
  const b = new Uint8Array(24)
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  b.set([0, 0, 0, 13], 8)
  b.set([0x49, 0x48, 0x44, 0x52], 12)
  b.set([(width >>> 24) & 0xff, (width >>> 16) & 0xff, (width >>> 8) & 0xff, width & 0xff], 16)
  b.set([(height >>> 24) & 0xff, (height >>> 16) & 0xff, (height >>> 8) & 0xff, height & 0xff], 20)
  return b
}

function jpeg(width: number, height: number): Uint8Array {
  const b = new Uint8Array(19)
  let o = 0
  b[o++] = 0xff
  b[o++] = 0xd8
  b[o++] = 0xff
  b[o++] = 0xe0
  b[o++] = 0x00
  b[o++] = 0x02
  b[o++] = 0xff
  b[o++] = 0xc0
  b[o++] = 0x00
  b[o++] = 0x0b
  b[o++] = 0x08
  b[o++] = (height >> 8) & 0xff
  b[o++] = height & 0xff
  b[o++] = (width >> 8) & 0xff
  b[o++] = width & 0xff
  b[o++] = 0x01
  b[o++] = 0x01
  b[o++] = 0x11
  b[o++] = 0x00
  return b
}

function webpLossless(width: number, height: number): Uint8Array {
  const b = new Uint8Array(25)
  b.set([0x52, 0x49, 0x46, 0x46], 0)
  b.set([0x57, 0x45, 0x42, 0x50], 8)
  b.set([0x56, 0x50, 0x38, 0x4c], 12)
  b[20] = 0x2f
  const bits = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14)
  b[21] = bits & 0xff
  b[22] = (bits >> 8) & 0xff
  b[23] = (bits >> 16) & 0xff
  b[24] = (bits >> 24) & 0xff
  return b
}

function webpExtended(width: number, height: number): Uint8Array {
  const b = new Uint8Array(30)
  b.set([0x52, 0x49, 0x46, 0x46], 0)
  b.set([0x57, 0x45, 0x42, 0x50], 8)
  b.set([0x56, 0x50, 0x38, 0x58], 12)
  const w = width - 1
  const h = height - 1
  b[24] = w & 0xff
  b[25] = (w >> 8) & 0xff
  b[26] = (w >> 16) & 0xff
  b[27] = h & 0xff
  b[28] = (h >> 8) & 0xff
  b[29] = (h >> 16) & 0xff
  return b
}

function webpLossy(width: number, height: number): Uint8Array {
  const b = new Uint8Array(30)
  b.set([0x52, 0x49, 0x46, 0x46], 0)
  b.set([0x57, 0x45, 0x42, 0x50], 8)
  b.set([0x56, 0x50, 0x38, 0x20], 12)
  b.set([0x9d, 0x01, 0x2a], 23)
  b[26] = width & 0xff
  b[27] = (width >> 8) & 0xff
  b[28] = height & 0xff
  b[29] = (height >> 8) & 0xff
  return b
}

describe('readImageDimensions', () => {
  it('reads PNG dimensions from the IHDR chunk', () => {
    expect(readImageDimensions(png(320, 240).buffer)).toEqual({ width: 320, height: 240 })
  })

  it('reads JPEG dimensions from a SOF marker after an APP segment', () => {
    expect(readImageDimensions(jpeg(640, 480).buffer)).toEqual({ width: 640, height: 480 })
  })

  it('reads WebP lossless dimensions', () => {
    expect(readImageDimensions(webpLossless(1280, 720).buffer)).toEqual({
      width: 1280,
      height: 720,
    })
  })

  it('reads WebP extended dimensions', () => {
    expect(readImageDimensions(webpExtended(1920, 1080).buffer)).toEqual({
      width: 1920,
      height: 1080,
    })
  })

  it('reads WebP lossy dimensions', () => {
    expect(readImageDimensions(webpLossy(800, 600).buffer)).toEqual({
      width: 800,
      height: 600,
    })
  })

  it('returns null for non-image bytes', () => {
    expect(readImageDimensions(new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer)).toBeNull()
    expect(readImageDimensions(new Uint8Array([]).buffer)).toBeNull()
  })

  it('returns null for truncated headers', () => {
    expect(readImageDimensions(png(10, 10).slice(0, 8).buffer)).toBeNull()
    expect(readImageDimensions(new Uint8Array([0xff, 0xd8, 0xff]).buffer)).toBeNull()
  })

  it('does not produce a negative dimension for a forged PNG size', () => {
    const forged = png(0xffffffff, 0xffffffff)
    const dims = readImageDimensions(forged.buffer)
    expect(dims).not.toBeNull()
    expect(dims!.width).toBe(0xffffffff)
    expect(dims!.height).toBe(0xffffffff)
  })
})
