import { describe, it, expect } from 'vitest'
import { calculateBelievers, BASE_PER_SOURCE } from './believers-calculator'
import type { Source } from './types'

function makeSource(tier: Source['tier'], multiplier: number): Source {
  return { url: 'https://example.com', tier, multiplier, claims: [], screenshot: '' }
}

describe('calculateBelievers', () => {
  it('returns 0 believers and first milestone for empty sources', () => {
    const result = calculateBelievers([])
    expect(result.believers).toBe(0)
    expect(result.milestone).toBe('Your weird uncle')
  })

  it('calculates believers for a single COMMON source', () => {
    const result = calculateBelievers([makeSource('COMMON', 1)])
    expect(result.believers).toBe(BASE_PER_SOURCE * 1)
  })

  it('calculates believers for a single RARE source', () => {
    const result = calculateBelievers([makeSource('RARE', 1.5)])
    expect(result.believers).toBe(BASE_PER_SOURCE * 1.5)
  })

  it('calculates believers for a single MYTHIC source', () => {
    const result = calculateBelievers([makeSource('MYTHIC', 5)])
    expect(result.believers).toBe(BASE_PER_SOURCE * 5)
  })

  it('accumulates believers across multiple sources', () => {
    const sources = [
      makeSource('COMMON', 1),
      makeSource('RARE', 1.5),
      makeSource('EPIC', 2),
    ]
    const result = calculateBelievers(sources)
    expect(result.believers).toBe(BASE_PER_SOURCE * (1 + 1.5 + 2))
  })

  it('returns "Your weird uncle" milestone for score < 10', () => {
    const result = calculateBelievers([makeSource('COMMON', 1)])
    expect(result.milestone).toBe('Your weird uncle')
  })

  it('returns "Your coworkers" milestone when believers reach 10', () => {
    // Need enough sources to hit exactly 10
    const sources = Array.from({ length: Math.ceil(10 / BASE_PER_SOURCE) }, () =>
      makeSource('COMMON', 1)
    )
    const result = calculateBelievers(sources)
    expect(result.believers).toBeGreaterThanOrEqual(10)
    expect(result.milestone).toBe('Your coworkers')
  })

  it('returns "A subreddit" milestone around 1000 believers', () => {
    const count = Math.ceil(1000 / BASE_PER_SOURCE)
    const sources = Array.from({ length: count }, () => makeSource('COMMON', 1))
    const result = calculateBelievers(sources)
    expect(result.milestone).toBe('A subreddit')
  })

  it('returns "Half the internet" for 1B+ believers', () => {
    // Fake a billion directly with one source that has a huge synthetic multiplier
    const sources = [makeSource('MYTHIC', 1_000_000_000 / BASE_PER_SOURCE)]
    const result = calculateBelievers(sources)
    expect(result.believers).toBeGreaterThanOrEqual(1_000_000_000)
    expect(result.milestone).toBe('Half the internet')
  })

  it('milestone "YouTube comment section" at 10k believers', () => {
    const count = Math.ceil(10_000 / BASE_PER_SOURCE)
    const sources = Array.from({ length: count }, () => makeSource('COMMON', 1))
    const result = calculateBelievers(sources)
    expect(result.milestone).toBe('YouTube comment section')
  })
})
