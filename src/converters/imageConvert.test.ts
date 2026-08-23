import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConversionError } from './types'
import { imageConvert } from './imageConvert'

function pngHeader(width: number, height: number): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(24)
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  b.set([0, 0, 0, 13], 8)
  b.set([0x49, 0x48, 0x44, 0x52], 12)
  b.set([(width >>> 24) & 0xff, (width >>> 16) & 0xff, (width >>> 8) & 0xff, width & 0xff], 16)
  b.set([(height >>> 24) & 0xff, (height >>> 16) & 0xff, (height >>> 8) & 0xff, height & 0xff], 20)
  return b
}

describe('imageConvert.convert', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects a file the browser cannot decode as an image', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('decode failed')
      }),
    )

    const file = new File(['not an image'], 'photo.png')
    await expect(imageConvert.convert(file)).rejects.toThrowError(ConversionError)
  })

  it('rejects an image with absurd dimensions before rendering', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 20000, height: 20000, close: () => {} })),
    )

    const file = new File(['x'], 'huge.png')
    await expect(imageConvert.convert(file)).rejects.toThrowError(/too large/)
  })

  it('rejects an oversized image from its header before decoding', async () => {
    const createImageBitmapMock = vi.fn()
    vi.stubGlobal('createImageBitmap', createImageBitmapMock)

    const file = new File([pngHeader(20000, 20000)], 'huge.png')
    await expect(imageConvert.convert(file)).rejects.toThrowError(/too large/)
    expect(createImageBitmapMock).not.toHaveBeenCalled()
  })
})
