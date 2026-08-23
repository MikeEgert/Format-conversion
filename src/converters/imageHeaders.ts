export interface ImageDimensions {
  width: number
  height: number
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function pngDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 24) return null
  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return null
  }
  const type = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15])
  if (type !== 'IHDR') return null
  const width =
    ((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0
  const height =
    ((bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]) >>> 0
  return { width, height }
}

function jpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let offset = 2
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = bytes[offset + 1]
    if (marker === 0xff) {
      offset += 1
      continue
    }
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    if (isSof) {
      if (offset + 9 > bytes.length) return null
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6]
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8]
      return { width, height }
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      if (marker === 0xd9) return null
      offset += 2
      continue
    }
    if (offset + 4 > bytes.length) return null
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    offset += 2 + length
  }
  return null
}

function webpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 16) return null
  if (bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46) return null
  if (bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50) return null
  const fourcc = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15])

  if (fourcc === 'VP8X') {
    if (bytes.length < 30) return null
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16))
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16))
    return { width, height }
  }

  if (fourcc === 'VP8L') {
    if (bytes.length < 25) return null
    if (bytes[20] !== 0x2f) return null
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }

  if (fourcc === 'VP8 ') {
    if (bytes.length < 30) return null
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null
    const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff
    const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff
    return { width, height }
  }

  return null
}

export function readImageDimensions(buffer: ArrayBufferLike): ImageDimensions | null {
  const bytes = new Uint8Array(buffer)
  return pngDimensions(bytes) ?? jpegDimensions(bytes) ?? webpDimensions(bytes)
}
