import { isHeicFile, replaceExtension, resizeImage } from './helpers'
import { ConversionError, type Converter } from './types'

export const heicToJpg: Converter = {
  id: 'heic-to-jpg',
  name: 'HEIC to JPG',
  fromLabel: 'HEIC',
  toLabel: 'JPG',
  description: 'Convert iPhone HEIC photos to universally-supported JPG.',
  detail: {
    about:
      'Turn iPhone and camera HEIC/HEIF photos into universally-supported JPG. Share and open your photos anywhere without compatibility problems.',
    useCases: [
      'Open iPhone photos on Windows or older apps',
      'Upload HEIC files to sites that only accept JPG',
      'Resize large photos down for faster sharing',
    ],
    accepts: ['HEIC', 'HEIF'],
  },
  accept: '.heic,.heif,image/heic,image/heif',
  outputType: 'image/jpeg',
  supportsQuality: true,
  supportsResize: true,
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
      const maxDimension = options?.maxDimension ?? 0
      const output =
        maxDimension > 0
          ? await resizeImage(jpeg, maxDimension, 'image/jpeg', options?.quality ?? 0.9)
          : new Blob([jpeg], { type: 'image/jpeg' })
      return {
        blob: output,
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
