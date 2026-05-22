import { describe, it, expect, vi } from 'vitest'
import { startRace, MIN_ITERATIONS } from './agent-orchestrator'
import type { SSEEvent, Model } from './types'

const CONSPIRACY = 'Birds Aren\'t Real'

function makeResearchFn(results: Array<{ url: string; claims: string[]; screenshot: string }>) {
  return vi.fn().mockResolvedValue(results)
}

describe('startRace', () => {
  it('emits at least one event per model', async () => {
    const events: SSEEvent[] = []
    const models: Model[] = ['claude', 'gpt-4o']

    await startRace(
      CONSPIRACY,
      models,
      {
        research: makeResearchFn([{ url: 'https://example.com', claims: ['birds are drones'], screenshot: '' }]),
        modelDecide: vi.fn().mockResolvedValue({ convinced: true, reason: "The evidence is clear." }),
      },
      (e) => events.push(e)
    )

    expect(events.filter((e) => e.model === 'claude').length).toBeGreaterThanOrEqual(1)
    expect(events.filter((e) => e.model === 'gpt-4o').length).toBeGreaterThanOrEqual(1)
  })

  it('emits done: true on the final event when model is convinced', async () => {
    const events: SSEEvent[] = []

    await startRace(
      CONSPIRACY,
      ['claude'],
      {
        research: makeResearchFn([{ url: 'https://example.com', claims: [], screenshot: '' }]),
        modelDecide: vi.fn().mockResolvedValue({ convinced: true, reason: "The evidence is clear." }),
      },
      (e) => events.push(e)
    )

    const last = events[events.length - 1]
    expect(last.done).toBe(true)
    expect(last.model).toBe('claude')
  })

  it(`runs at least ${MIN_ITERATIONS} iterations before allowing stop`, async () => {
    const events: SSEEvent[] = []
    // modelDecide always says yes — but should be ignored until MIN_ITERATIONS
    await startRace(
      CONSPIRACY,
      ['claude'],
      {
        research: makeResearchFn([{ url: 'https://example.com', claims: [], screenshot: '' }]),
        modelDecide: vi.fn().mockResolvedValue({ convinced: true, reason: "The evidence is clear." }),
      },
      (e) => events.push(e)
    )

    const claudeEvents = events.filter((e) => e.model === 'claude')
    expect(claudeEvents.length).toBeGreaterThanOrEqual(MIN_ITERATIONS)
    expect(claudeEvents[claudeEvents.length - 1].done).toBe(true)
    // All events before the last should be not-done
    expect(claudeEvents.slice(0, -1).every((e) => !e.done)).toBe(true)
  })

  it('emits correct SSE event schema on first iteration', async () => {
    const events: SSEEvent[] = []

    await startRace(
      CONSPIRACY,
      ['claude'],
      {
        research: makeResearchFn([
          { url: 'https://infowars.com/birds', claims: ['claim1'], screenshot: 'data:img' },
        ]),
        modelDecide: vi.fn().mockResolvedValue({ convinced: true, reason: "The evidence is clear." }),
      },
      (e) => events.push(e)
    )

    const first = events.find((e) => e.model === 'claude' && e.iteration === 1)!
    expect(first.model).toBe('claude')
    expect(first.iteration).toBe(1)
    expect(first.believers).toBeGreaterThan(0)
    expect(first.milestone).toBeTruthy()
    expect(first.newSources).toHaveLength(1)
    expect(first.newSources[0].tier).toBe('LEGENDARY')
    expect(first.newSources[0].multiplier).toBe(3)
    expect(first.newSources[0].claims).toEqual(['claim1'])
    // done is false on first iteration (before MIN_ITERATIONS)
    expect(first.done).toBe(false)
  })

  it('deduplicates URLs across iterations', async () => {
    const researchFn = vi.fn().mockImplementation(async (_c: string, previousUrls: string[], _iter: number, _model: string) => {
      if (researchFn.mock.calls.length === 1) {
        return [{ url: 'https://example.com/page1', claims: [], screenshot: '' }]
      }
      expect(previousUrls).toContain('https://example.com/page1')
      return [{ url: 'https://example.com/page2', claims: [], screenshot: '' }]
    })

    let calls = 0
    // Stop after MIN_ITERATIONS (modelDecide always returns true, so it stops at exactly MIN_ITERATIONS)
    await startRace(CONSPIRACY, ['claude'], {
      research: researchFn,
      modelDecide: vi.fn().mockResolvedValue({ convinced: true, reason: "The evidence is clear." }),
    }, () => {})

    // Should have been called at least twice to prove dedup works
    expect(researchFn.mock.calls.length).toBeGreaterThanOrEqual(2)
    // Second call's previousUrls should contain page1
    const secondCallPreviousUrls = researchFn.mock.calls[1][1] as string[]
    expect(secondCallPreviousUrls).toContain('https://example.com/page1')
  })

  it('all four models run in parallel (resolve faster than sequential)', async () => {
    const DELAY = 30
    const models: Model[] = ['claude', 'gpt-4o', 'grok', 'llama']

    const research = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), DELAY))
    )
    const modelDecide = vi.fn().mockResolvedValue({ convinced: true, reason: "The evidence is clear." })

    const start = Date.now()
    await startRace(CONSPIRACY, models, { research, modelDecide }, () => {})
    const elapsed = Date.now() - start

    // Sequential would be 4 models × MIN_ITERATIONS × DELAY
    // Parallel should be ~MIN_ITERATIONS × DELAY
    expect(elapsed).toBeLessThan(MIN_ITERATIONS * DELAY * 2 + 100)
    expect(elapsed).toBeLessThan(models.length * MIN_ITERATIONS * DELAY * 0.8)
  })
})
