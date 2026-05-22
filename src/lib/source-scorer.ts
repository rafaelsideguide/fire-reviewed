import type { ScoredSource } from './types'

const MYTHIC_TLDS = ['.gov', '.edu']

const LEGENDARY_DOMAINS = [
  'infowars.com',
  'naturalnews.com',
  'bibliotecapleyades.net',
]

const EPIC_DOMAINS = ['youtube.com', 'medium.com']

const RARE_DOMAINS = ['reddit.com', 'quora.com']

function hostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith('.' + domain)
}

export function scoreSource(url: string): ScoredSource {
  const host = hostname(url)

  if (MYTHIC_TLDS.some((tld) => host.endsWith(tld))) {
    return { tier: 'MYTHIC', multiplier: 5 }
  }

  if (LEGENDARY_DOMAINS.some((d) => matchesDomain(host, d))) {
    return { tier: 'LEGENDARY', multiplier: 3 }
  }

  if (EPIC_DOMAINS.some((d) => matchesDomain(host, d))) {
    return { tier: 'EPIC', multiplier: 2 }
  }

  if (RARE_DOMAINS.some((d) => matchesDomain(host, d))) {
    return { tier: 'RARE', multiplier: 1.5 }
  }

  return { tier: 'COMMON', multiplier: 1 }
}
