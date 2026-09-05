import { describe, expect, it } from 'vitest'
import { convert, listConverters } from './api'

describe('listConverters', () => {
  it('exposes core conversion info only', () => {
    const list = listConverters()
    expect(list.length).toBeGreaterThan(0)
    for (const c of list) {
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('accept')
      expect(c).toHaveProperty('outputType')
      expect('name' in c).toBe(false)
      expect('description' in c).toBe(false)
    }
  })

  it('includes the csv-to-json converter', () => {
    expect(listConverters().map((c) => c.id)).toContain('csv-to-json')
  })
})

describe('convert', () => {
  it('converts a CSV file to JSON', async () => {
    const file = new File(['name,score\nAlice,10'], 'data.csv', { type: 'text/csv' })
    const result = await convert('csv-to-json', file)
    expect(result.filename).toBe('data.json')
    expect(await result.blob.text()).toBe(JSON.stringify([{ name: 'Alice', score: 10 }], null, 2))
  })

  it('rejects an unknown converter id', async () => {
    await expect(convert('nope', new File(['x'], 'x.csv'))).rejects.toThrow(/Unknown converter/)
  })
})
