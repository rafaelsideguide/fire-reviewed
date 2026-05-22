import type { Model, Source, SSEEvent } from './types'
import { scoreSource } from './source-scorer'
import { calculateBelievers } from './believers-calculator'

export const MIN_ITERATIONS = 4
export const MAX_ITERATIONS = 15

export type ResearchFn = (
  conspiracy: string,
  previousUrls: string[],
  iteration: number,
  model: Model,
  claimsHint?: string[]
) => Promise<Array<{ url: string; claims: string[]; screenshot: string }>>

export type ModelDecideFn = (
  model: Model,
  conspiracy: string,
  sources: Source[]
) => Promise<{ convinced: boolean; reason: string }>

export interface OrchestratorDeps {
  research: ResearchFn
  modelDecide: ModelDecideFn
}

async function runAgent(
  model: Model,
  conspiracy: string,
  deps: OrchestratorDeps,
  onEvent: (event: SSEEvent) => void,
  stop: { value: boolean },
  onConvinced: () => void
): Promise<void> {
  const previousUrls: string[] = []
  const accumulatedSources: Source[] = []
  let iteration = 0
  let staleStreak = 0

  while (iteration < MAX_ITERATIONS && !stop.value) {
    iteration++

    const claimsHint = staleStreak >= 2
      ? accumulatedSources.flatMap((s) => s.claims).slice(-6)
      : undefined

    let raw: Array<{ url: string; claims: string[]; screenshot: string }> = []
    try {
      raw = await deps.research(conspiracy, previousUrls, iteration, model, claimsHint)
    } catch (err) {
      console.error(`[${model}] research error on iteration ${iteration}:`, err)
    }

    staleStreak = raw.length === 0 ? staleStreak + 1 : 0

    const newSources: Source[] = raw.map((r) => {
      const scored = scoreSource(r.url)
      return { ...scored, url: r.url, claims: r.claims, screenshot: r.screenshot }
    })

    for (const s of newSources) {
      previousUrls.push(s.url)
      accumulatedSources.push(s)
    }

    const { believers, milestone } = calculateBelievers(accumulatedSources)

    let convinced = false
    let convictionReason = ''

    if (iteration >= MIN_ITERATIONS) {
      const result = await deps.modelDecide(model, conspiracy, accumulatedSources)
      convinced = result.convinced
      convictionReason = result.reason
    }

    onEvent({
      model, iteration, believers, milestone, newSources,
      done: convinced,
      ...(convinced && convictionReason ? { convictionReason } : {}),
    })

    if (convinced) {
      onConvinced()
      break
    }
  }
}

export async function startRace(
  conspiracy: string,
  models: Model[],
  deps: OrchestratorDeps,
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const stop = { value: false }
  let convincedCount = 0

  const onConvinced = () => {
    convincedCount++
    if (convincedCount >= models.length - 1) stop.value = true
  }

  await Promise.all(
    models.map((model) => runAgent(model, conspiracy, deps, onEvent, stop, onConvinced))
  )
}
