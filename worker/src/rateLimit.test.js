import { describe, expect, it } from 'vitest'
import { createRateLimiter } from './rateLimit'

describe('createRateLimiter', () => {
  it('allows up to max requests within the window', () => {
    let t = 0
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3, now: () => t })
    expect(limiter.isLimited('a')).toBe(false)
    expect(limiter.isLimited('a')).toBe(false)
    expect(limiter.isLimited('a')).toBe(false)
    expect(limiter.isLimited('a')).toBe(true)
  })

  it('resets once the window slides past old hits', () => {
    let t = 0
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2, now: () => t })
    limiter.isLimited('a')
    limiter.isLimited('a')
    expect(limiter.isLimited('a')).toBe(true)
    t = 60_001
    expect(limiter.isLimited('a')).toBe(false)
  })

  it('tracks each key independently', () => {
    let t = 0
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1, now: () => t })
    expect(limiter.isLimited('a')).toBe(false)
    expect(limiter.isLimited('b')).toBe(false)
    expect(limiter.isLimited('a')).toBe(true)
    expect(limiter.isLimited('b')).toBe(true)
  })

  it('sweeps stale keys so the map cannot grow unbounded', () => {
    let t = 0
    const limiter = createRateLimiter({ windowMs: 60_000, max: 5, now: () => t })
    for (let i = 0; i < 1000; i++) limiter.isLimited(`ip-${i}`)
    expect(limiter.size()).toBe(1000)
    t = 120_001
    limiter.isLimited('a')
    expect(limiter.size()).toBe(1)
  })
})
