import { assertImageDimensions, isHeicFile, replaceExtension, scaledSize } from './helpers'
import { ConversionError, type Converter } from './types'
import type { HeifImage } from 'libheif-js/wasm-bundle'

async function decodeHeicToJpeg(
  file: File,
  arrayBuffer: ArrayBuffer,
  quality: number,
  maxDimension: number,
): Promise<Blob> {
  const libheif = (await import('libheif-js/wasm-bundle')).default

  let images: HeifImage[]
  try {
    images = new libheif.HeifDecoder().decode(new Uint8Array(arrayBuffer))
  } catch {
    throw new ConversionError(
      'Could not decode this HEIC image.',
      'The file may be corrupted or use an unsupported HEIF variant. Try opening it in Photos and re-exporting it as a JPEG.',
    )
  }

  const image = images[0]
  if (!image) {
    throw new ConversionError(
      'No image was found in this HEIC file.',
      'This file may not contain a decodable image. Try re-exporting it from Photos.',
    )
  }

  const width = image.get_width()
  const height = image.get_height()
  assertImageDimensions(width, height, file.name)

  const { width: outWidth, height: outHeight } = scaledSize(width, height, maxDimension)

  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new ConversionError(
      'Could not process this image.',
      'Your browser may not support canvas. Try a different browser.',
    )
  }

  const imageData = ctx.createImageData(width, height)
  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (displayData) => {
      if (!displayData) {
        reject(
          new ConversionError(
            'Could not decode this HEIC image.',
            'The file may be corrupted or use an unsupported HEIF variant. Try re-exporting it as a JPEG.',
          ),
        )
      } else {
        resolve()
      }
    })
  })

  if (outWidth !== width || outHeight !== height) {
    const source = document.createElement('canvas')
    source.width = width
    source.height = height
    const sourceCtx = source.getContext('2d')
    if (!sourceCtx) {
      throw new ConversionError(
        'Could not process this image.',
        'Your browser may not support canvas. Try a different browser.',
      )
    }
    sourceCtx.putImageData(imageData, 0, 0)
    ctx.drawImage(source, 0, 0, outWidth, outHeight)
    source.width = 0
    source.height = 0
  } else {
    ctx.putImageData(imageData, 0, 0)
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  canvas.width = 0
  canvas.height = 0
  if (!blob) {
    throw new ConversionError(
      'Could not encode this image.',
      'The image may be too large. Try a smaller file.',
    )
  }
  return blob
}

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
    const arrayBuffer = await file.arrayBuffer()
    if (!isHeicFile(arrayBuffer)) {
      throw new ConversionError(
        'This file is not a valid HEIC/HEIF image.',
        'HEIC photos come from iPhones and some cameras. Make sure you picked a real .heic or .heif file.',
      )
    }

    const blob = await decodeHeicToJpeg(
      file,
      arrayBuffer,
      options?.quality ?? 0.9,
      options?.maxDimension ?? 0,
    )
    return {
      blob,
      filename: replaceExtension(file.name, 'jpg'),
    }
  },
}
