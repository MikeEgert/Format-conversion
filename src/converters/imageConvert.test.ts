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
})
