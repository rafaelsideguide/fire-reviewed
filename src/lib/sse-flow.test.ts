import { describe, it, expect, vi } from 'vitest'
import { startRace } from './agent-orchestrator'
import type { SSEEvent, Model } from './types'

const CONSPIRACY = 'Birds Aren\'t Real'

describe('SSE event flow', () => {
  it('events arrive in iteration order per model', async () => {
    const events: SSEEvent[] = []
    let callCount = 0
    const modelDecide = vi.fn().mockImplementation(async () => ({ convinced: ++callCount % 3 === 0, reason: '' }))

    await startRace(
      CONSPIRACY,
      ['claude'],
      {
        research: vi.fn().mockResolvedValue([
          { url: 'https://example.com', claims: ['evidence'], screenshot: '' },
        ]),
        modelDecide,
      },
      (e) => events.push(e)
    )

    const claudeEvents = events.filter((e) => e.model === 'claude')
    for (let i = 0; i < claudeEvents.length; i++) {
      expect(claudeEvents[i].iteration).toBe(i + 1)
    }
  })

  it('events have correct SSE event schema fields', async () => {
    const events: SSEEvent[] = []

    await startRace(
      CONSPIRACY,
      ['claude'],
      {
        research: vi.fn().mockResolvedValue([
          { url: 'https://reddit.com/r/conspiracy', claims: ['claim'], screenshot: 'img' },
        ]),
        modelDecide: vi.fn().mockResolvedValue({ convinced: true, reason: "The evidence is clear." }),
      },
      (e) => events.push(e)
    )

    // First event is iteration 1, not done yet (min iterations enforced)
    const event = events[0]
    expect(event).toMatchObject({
      model: 'claude',
      iteration: 1,
      done: false,
    })
    // Last event is done
    expect(events[events.length - 1].done).toBe(true)
    expect(typeof event.believers).toBe('number')
    expect(typeof event.milestone).toBe('string')
    expect(Array.isArray(event.newSources)).toBe(true)
    expect(event.newSources[0]).toMatchObject({
      url: 'https://reddit.com/r/conspiracy',
      tier: 'RARE',
      multiplier: 1.5,
      claims: ['claim'],
      screenshot: 'img',
    })
  })

  it('multiple models produce independent event streams', async () => {
    const events: SSEEvent[] = []
    const models: Model[] = ['claude', 'gpt-4o', 'grok', 'llama']

    const decide: Record<string, number> = {}

    await startRace(
      CONSPIRACY,
      models,
      {
        research: vi.fn().mockResolvedValue([
          { url: 'https://naturalnews.com/story', claims: [], screenshot: '' },
        ]),
        modelDecide: vi.fn().mockImplementation(async (model: Model) => {
          decide[model] = (decide[model] ?? 0) + 1
          return { convinced: decide[model] >= 2, reason: 'Enough evidence.' }
        }),
      },
      (e) => events.push(e)
    )

    for (const model of models) {
      const modelEvents = events.filter((e) => e.model === model)
      // Each model runs at least MIN_ITERATIONS, so > 2
      expect(modelEvents.length).toBeGreaterThanOrEqual(4)
      expect(modelEvents[modelEvents.length - 1].done).toBe(true)
    }
  })

  it('believers score grows monotonically across iterations', async () => {
    const events: SSEEvent[] = []
    let calls = 0
    const modelDecide = vi.fn().mockImplementation(async () => ({ convinced: ++calls >= 5, reason: '' }))

    await startRace(
      CONSPIRACY,
      ['claude'],
      {
        research: vi.fn().mockResolvedValue([
          { url: 'https://example.com', claims: [], screenshot: '' },
        ]),
        modelDecide,
      },
      (e) => events.push(e)
    )

    const claudeEvents = events.filter((e) => e.model === 'claude')
    for (let i = 1; i < claudeEvents.length; i++) {
      expect(claudeEvents[i].believers).toBeGreaterThanOrEqual(claudeEvents[i - 1].believers)
    }
  })
})
