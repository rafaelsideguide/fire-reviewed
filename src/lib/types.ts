export type Model = 'claude' | 'gpt-4o' | 'grok' | 'llama'
export type SkepticismLevel = 'easy' | 'medium' | 'hard'
export type Tier = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC'
export type Milestone =
  | 'Your weird uncle'
  | 'Your coworkers'
  | 'Local conspiracy meetup'
  | 'A subreddit'
  | 'YouTube comment section'
  | 'Facebook group at 2am'
  | 'Cable news segment'
  | 'Trending on Twitter'
  | 'Congressional hearing'
  | 'Half the internet'

export interface Source {
  url: string
  tier: Tier
  multiplier: number
  claims: string[]
  screenshot: string
}

export interface SSEEvent {
  model: Model
  iteration: number
  believers: number
  milestone: Milestone
  newSources: Source[]
  done: boolean
  convictionReason?: string
}

export interface ScoredSource {
  tier: Tier
  multiplier: number
}

export interface BelieversResult {
  believers: number
  milestone: Milestone
}
