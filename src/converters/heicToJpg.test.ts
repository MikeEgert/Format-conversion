import { describe, expect, it } from 'vitest'
import { ConversionError } from './types'
import { heicToJpg } from './heicToJpg'

describe('heicToJpg.convert', () => {
  it('rejects a file that is not HEIC/HEIF', async () => {
    const file = new File(['this is definitely not a heic image'], 'photo.heic')
    await expect(heicToJpg.convert(file)).rejects.toThrowError(ConversionError)
  })
})
