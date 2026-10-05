import { zipSync } from 'fflate'
import type { ConversionResult } from '../converters/types'

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  let completed = 0

  async function worker() {
    while (next < items.length && !signal?.aborted) {
      const i = next
      next += 1
      results[i] = await fn(items[i], i)
      completed += 1
      onProgress?.(completed, items.length)
    }
  }

  const count = Math.max(1, Math.min(limit, items.length))
  await Promise.all(Array.from({ length: count }, worker))
  return results
}

export async function zipResults(results: ConversionResult[]): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {}
  const originalNames = new Set(results.map((result) => result.filename))
  const usedNames = new Set<string>()

  for (const result of results) {
    const original = result.filename
    let name = original
    if (usedNames.has(name)) {
      const dot = original.lastIndexOf('.')
      const base = dot > 0 ? original.slice(0, dot) : original
      const ext = dot > 0 ? original.slice(dot) : ''
      let count = 2
      do {
        name = `${base} (${count})${ext}`
        count += 1
      } while (usedNames.has(name) || originalNames.has(name))
    }

    usedNames.add(name)
    entries[name] = new Uint8Array(await result.blob.arrayBuffer())
  }

  const zipped = zipSync(entries, { level: 0 })
  return new Blob([zipped], { type: 'application/zip' })
}
