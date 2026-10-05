import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { mapWithConcurrency, zipResults } from './batch'

describe('mapWithConcurrency', () => {
  it('runs all items in order', async () => {
    const results = await mapWithConcurrency([1, 2, 3], 1, async (n) => n * 2)
    expect(results).toEqual([2, 4, 6])
  })

  it('runs multiple workers up to the limit', async () => {
    let active = 0
    let peak = 0
    const results = await mapWithConcurrency(
      [1, 2, 3, 4],
      2,
      async (n) => {
        active += 1
        peak = Math.max(peak, active)
        await new Promise((r) => setTimeout(r, 5))
        active -= 1
        return n
      },
    )
    expect(results).toEqual([1, 2, 3, 4])
    expect(peak).toBe(2)
  })

  it('does not start any item when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const calls: number[] = []
    const results = await mapWithConcurrency(
      [1, 2, 3],
      1,
      async (n) => {
        calls.push(n)
        return n
      },
      undefined,
      controller.signal,
    )
    expect(calls).toEqual([])
    expect(results).toEqual([undefined, undefined, undefined])
  })

  it('stops scheduling new items once the signal aborts mid-run', async () => {
    const controller = new AbortController()
    let started = 0
    const results = await mapWithConcurrency(
      [1, 2, 3],
      1,
      async (n) => {
        started += 1
        await new Promise((r) => setTimeout(r, 5))
        if (n === 1) controller.abort()
        return n * 10
      },
      undefined,
      controller.signal,
    )
    expect(started).toBe(1)
    expect(results[0]).toBe(10)
    expect(results[1]).toBeUndefined()
    expect(results[2]).toBeUndefined()
  })
})

describe('zipResults', () => {
  it('keeps every file when a generated name matches another original name', async () => {
    const names = ['a.csv', 'a.csv', 'a (2).csv']
    const results = names.map((filename, index) => ({
      filename,
      blob: new Blob([String(index + 1)]),
    }))

    const zip = await zipResults(results)
    const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
    const contents = Object.fromEntries(
      Object.entries(files).map(([name, bytes]) => [name, strFromU8(bytes)]),
    )

    expect(contents).toEqual({
      'a.csv': '1',
      'a (3).csv': '2',
      'a (2).csv': '3',
    })
  })
})
