import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConversionError } from './types'
import { imageConvert } from './imageConvert'

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
})
