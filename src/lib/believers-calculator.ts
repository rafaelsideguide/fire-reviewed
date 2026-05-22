import type { Source, Milestone, BelieversResult } from './types'

export const BASE_PER_SOURCE = 100

const MILESTONES: { threshold: number; label: Milestone }[] = [
  { threshold: 1_000_000_000, label: 'Half the internet' },
  { threshold: 100_000_000, label: 'Congressional hearing' },
  { threshold: 10_000_000, label: 'Trending on Twitter' },
  { threshold: 1_000_000, label: 'Cable news segment' },
  { threshold: 100_000, label: 'Facebook group at 2am' },
  { threshold: 10_000, label: 'YouTube comment section' },
  { threshold: 1_000, label: 'A subreddit' },
  { threshold: 100, label: 'Local conspiracy meetup' },
  { threshold: 10, label: 'Your coworkers' },
  { threshold: 0, label: 'Your weird uncle' },
]

export function calculateBelievers(sources: Source[]): BelieversResult {
  const believers = sources.reduce(
    (sum, s) => sum + BASE_PER_SOURCE * s.multiplier,
    0
  )

  const milestone = MILESTONES.find((m) => believers >= m.threshold)!.label

  return { believers, milestone }
}
