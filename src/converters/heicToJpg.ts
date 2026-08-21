import { isHeicFile, replaceExtension } from './helpers'
import { ConversionError, type Converter } from './types'

export const heicToJpg: Converter = {
  id: 'heic-to-jpg',
  name: 'HEIC to JPG',
  fromLabel: 'HEIC',
  toLabel: 'JPG',
  description: 'Convert iPhone HEIC photos to universally-supported JPG.',
  accept: '.heic,.heif,image/heic,image/heif',
  outputType: 'image/jpeg',
  supportsQuality: true,
  async convert(file, options) {
    const buffer = await file.arrayBuffer()
    if (!isHeicFile(buffer)) {
      throw new ConversionError(
        'This file is not a valid HEIC/HEIF image.',
        'HEIC photos come from iPhones and some cameras. Make sure you picked a real .heic or .heif file.',
      )
    }

    const heic2any = (await import('heic2any')).default

    try {
      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: options?.quality ?? 0.9,
      })
      const jpeg = Array.isArray(blob) ? blob[0] : blob
      return {
        blob: new Blob([jpeg], { type: 'image/jpeg' }),
        filename: replaceExtension(file.name, 'jpg'),
      }
    } catch {
      throw new ConversionError(
        'Could not decode this HEIC image.',
        'The file may be corrupted or use an unsupported HEIF variant. Try opening it in Photos and re-exporting it as a JPEG.',
      )
    }
  },
}
