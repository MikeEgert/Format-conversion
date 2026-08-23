import { assertImageDimensions, replaceExtension, scaledSize } from './helpers'
import { ConversionError, type Converter, type ImageFormat } from './types'

const MIME: Record<ImageFormat, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export const imageConvert: Converter = {
  id: 'image',
  name: 'Image',
  fromLabel: 'Image',
  toLabel: 'JPG/PNG/WebP',
  description: 'Convert PNG, JPG, and WebP images between formats.',
  detail: {
    about:
      'Convert between PNG, JPG, and WebP in any direction, resize images down, or reduce file size — all in your browser.',
    useCases: [
      'Open a .webp file in an app that only accepts JPG or PNG',
      'Resize a large image down for email, forms, or upload limits',
      'Reduce file size by switching format or lowering quality',
    ],
    accepts: ['PNG', 'JPG', 'WebP'],
  },
  accept: '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp',
  outputType: 'image/jpeg',
  supportsQuality: true,
  supportsResize: true,
  formats: [
    { id: 'jpg', label: 'JPG', lossy: true },
    { id: 'png', label: 'PNG', lossy: false },
    { id: 'webp', label: 'WebP', lossy: true },
  ],
  async convert(file, options) {
    const format = options?.format ?? 'jpg'
    const quality = options?.quality ?? 0.9
    const mime = MIME[format]

    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(file)
    } catch {
      throw new ConversionError(
        "This file isn't a supported image.",
        'Try a PNG, JPG, or WebP file. If it came from another app, open it and re-export it as one of those formats.',
      )
    }

    assertImageDimensions(bitmap.width, bitmap.height, file.name)

    const { width, height } = scaledSize(bitmap.width, bitmap.height, options?.maxDimension ?? 0)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      bitmap.close()
      throw new ConversionError(
        'Could not process this image.',
        'Your browser may not support this image. Try a different file or output format.',
      )
    }

    if (format === 'jpg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality))
    if (!blob) {
      throw new ConversionError(
        'Could not encode this image.',
        'The image may be too large. Try a smaller file or a different output format.',
      )
    }

    return {
      blob,
      filename: replaceExtension(file.name, format),
    }
  },
}
