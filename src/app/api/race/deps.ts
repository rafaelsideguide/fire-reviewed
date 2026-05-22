import type { ResearchFn, ModelDecideFn } from '@/lib/agent-orchestrator'
import type { Model, Source, SkepticismLevel } from '@/lib/types'
import { research } from '@/lib/firecrawl-researcher'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

let anthropic: Anthropic | null = null
let openai: OpenAI | null = null
let grok: OpenAI | null = null

function getAnthropic(): Anthropic {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropic
}

function getOpenAI(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}

function getGrok(): OpenAI {
  if (!grok) {
    grok = new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: process.env.XAI_API_KEY,
    })
  }
  return grok
}

const TIER_ORDER: Record<Source['tier'], number> = { MYTHIC: 0, LEGENDARY: 1, EPIC: 2, RARE: 3, COMMON: 4 }

const PERSONA: Record<SkepticismLevel, { intro: string; threshold: string }> = {
  easy: {
    intro: `You are a passionate truth-seeker who knows mainstream narratives hide something. You're primed to connect the dots and you trust your gut.`,
    threshold: `If there's any consistent pattern across the sources — even speculative — that's enough for you to call it. You lean toward YES.`,
  },
  medium: {
    intro: `You are an investigative journalist who follows evidence wherever it leads. You're fair — not a true believer, not a reflexive debunker.`,
    threshold: `If multiple independent sources point in the same direction with specific details, that's enough for you to call it.`,
  },
  hard: {
    intro: `You are a professional fact-checker at a major debunking publication. Your job is to find holes in every theory. You are hard to convince.`,
    threshold: `You require primary sources, verifiable specifics, and a pattern that cannot be explained by coincidence or confirmation bias. A few blogs won't cut it.`,
  },
}

const CONVICTION_PROMPT = (conspiracy: string, sources: Source[], skepticism: SkepticismLevel) => {
  const sorted = [...sources].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])

  // show up to 50 claims, high-credibility sources first, tagged with tier
  const claims = sorted
    .flatMap((s) => s.claims.map((c) => `[${s.tier}] ${c}`))
    .slice(0, 50)

  const tierCounts = sources.reduce<Record<string, number>>((acc, s) => {
    acc[s.tier] = (acc[s.tier] || 0) + 1
    return acc
  }, {})
  const sourceSummary = Object.entries(tierCounts)
    .sort(([a], [b]) => TIER_ORDER[a as Source['tier']] - TIER_ORDER[b as Source['tier']])
    .map(([tier, n]) => `${n} ${tier}`)
    .join(', ')

  const { intro, threshold } = PERSONA[skepticism]

  return `${intro}

You are researching: "${conspiracy}"

You have reviewed ${sources.length} sources (${sourceSummary}).

Key claims extracted from those sources:
${claims.map((c) => `- ${c}`).join('\n') || '  (none yet — keep digging)'}

${threshold}

Are you convinced this is true, or at least that there is real substance here?

If yes: YES: [one sentence in your own voice — what specifically convinced you]
If no: NO

Reply with nothing else.`
}

function parseDecision(text: string): { convinced: boolean; reason: string } {
  const trimmed = text.trim()
  if (trimmed.toUpperCase().startsWith('YES')) {
    const reason = trimmed.replace(/^YES:\s*/i, '').trim() || 'The evidence is overwhelming.'
    return { convinced: true, reason }
  }
  return { convinced: false, reason: '' }
}

export function getResearchFn(): ResearchFn {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FirecrawlApp = require('@mendable/firecrawl-js').default
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })
  return (conspiracy, previousUrls, iteration, model, claimsHint) =>
    research(firecrawl, conspiracy, previousUrls, iteration, model, claimsHint)
}

export function getModelDecideFn(skepticism: SkepticismLevel = 'medium'): ModelDecideFn {
  return async (model: Model, conspiracy: string, sources: Source[]) => {
    const prompt = CONVICTION_PROMPT(conspiracy, sources, skepticism)
    const fallback = { convinced: false, reason: '' }

    try {
      if (model === 'claude') {
        const resp = await getAnthropic().messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          messages: [{ role: 'user', content: prompt }],
        })
        const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
        return parseDecision(text)
      }

      if (model === 'gpt-4o') {
        const resp = await getOpenAI().chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 150,
          messages: [{ role: 'user', content: prompt }],
        })
        return parseDecision(resp.choices[0].message.content ?? '')
      }

      if (model === 'grok') {
        const resp = await getGrok().chat.completions.create({
          model: 'grok-3-mini',
          max_tokens: 150,
          messages: [{ role: 'user', content: prompt }],
        })
        return parseDecision(resp.choices[0].message.content ?? '')
      }

      if (model === 'llama') {
        const resp = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2:1b',
            stream: false,
            messages: [{ role: 'user', content: prompt }],
          }),
        })
        const json = await resp.json()
        return parseDecision(json?.message?.content ?? '')
      }
    } catch (err) {
      console.error(`Model ${model} decide error:`, err)
    }

    return fallback
  }
}
