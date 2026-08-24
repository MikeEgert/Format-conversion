declare module 'libheif-js/wasm-bundle' {
  export interface HeifImage {
    get_width(): number
    get_height(): number
    display(data: ImageData, callback: (data: ImageData | null) => void): void
  }

  export class HeifDecoder {
    decode(data: Uint8Array | ArrayBuffer): HeifImage[]
  }

  const libheif: { HeifDecoder: typeof HeifDecoder }
  export default libheif
}
