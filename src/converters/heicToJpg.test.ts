import { describe, expect, it, vi } from 'vitest'
import { ConversionError } from './types'
import { heicToJpg } from './heicToJpg'

vi.mock('heic2any', () => ({
  default: vi.fn(async () => {
    throw new Error('decode failed')
  }),
}))

function heicSignatureBuffer(): ArrayBuffer {
  const bytes = new Uint8Array(12)
  bytes.set([0x66, 0x74, 0x79, 0x70], 4)
  return bytes.buffer
}

describe('heicToJpg.convert', () => {
  it('rejects a file that is not HEIC/HEIF', async () => {
    const file = new File(['this is definitely not a heic image'], 'photo.heic')
    await expect(heicToJpg.convert(file)).rejects.toThrowError(ConversionError)
  })

  it('rejects a HEIC-signed file whose body cannot be decoded', async () => {
    const file = new File([heicSignatureBuffer()], 'corrupt.heic')
    await expect(heicToJpg.convert(file)).rejects.toThrowError(/Could not decode/)
  })
})
