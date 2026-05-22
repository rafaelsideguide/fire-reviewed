interface SearchResultItem {
  url?: string
  title?: string
  description?: string
}

interface ScrapeResult {
  markdown?: string
  screenshot?: string
}

interface FirecrawlClient {
  search: (query: string, options?: object) => Promise<{ web?: SearchResultItem[] }>
  scrape: (url: string, options?: object) => Promise<ScrapeResult>
}

type Model = 'claude' | 'gpt-4o' | 'grok' | 'llama'

const QUERY_ANGLES = [
  'evidence proof',
  'documentary whistleblower',
  'government cover-up exposed',
  'scientific research analysis',
  'leaked documents secret files',
  'eyewitness testimony firsthand',
  'history origin truth revealed',
  'experts researchers investigation',
  'news report confirmed',
  'reddit forum discussion believers',
  'youtube video footage',
  'podcast interview confession',
]

// Each model starts at a different offset so they explore different angles
const MODEL_OFFSET: Record<Model, number> = {
  claude: 0,
  'gpt-4o': 3,
  grok: 6,
  llama: 9,
}

export async function research(
  firecrawl: FirecrawlClient,
  conspiracy: string,
  previousUrls: string[],
  iteration: number,
  model: Model,
  claimsHint?: string[]
): Promise<Array<{ url: string; claims: string[]; screenshot: string }>> {
  const offset = MODEL_OFFSET[model]

  // When stale: search for specific claims found so far instead of generic angles
  const queries = claimsHint && claimsHint.length > 0
    ? [
        claimsHint[0].slice(0, 80),
        claimsHint[1]?.slice(0, 80) ?? `${conspiracy} hidden truth`,
      ]
    : [
        `${conspiracy} ${QUERY_ANGLES[(offset + iteration - 1) % QUERY_ANGLES.length]}`,
        `${conspiracy} ${QUERY_ANGLES[(offset + iteration) % QUERY_ANGLES.length]}`,
      ]

  const [r1, r2] = await Promise.all([
    firecrawl.search(queries[0], { limit: 5 }).catch(() => ({ web: [] })),
    firecrawl.search(queries[1], { limit: 5 }).catch(() => ({ web: [] })),
  ])

  const seen = new Set(previousUrls)
  const newItems: Array<SearchResultItem & { url: string }> = []

  for (const item of [...(r1.web ?? []), ...(r2.web ?? [])]) {
    if (typeof item.url === 'string' && !seen.has(item.url)) {
      seen.add(item.url)
      newItems.push(item as SearchResultItem & { url: string })
    }
  }

  const sources = await Promise.all(
    newItems.map(async (result) => {
      let screenshot = ''
      let claims: string[] = []

      try {
        const scraped = await firecrawl.scrape(result.url, {
          formats: ['markdown', 'screenshot'],
        })
        screenshot = scraped.screenshot ?? ''
        if (scraped.markdown) {
          claims = extractClaims(scraped.markdown, conspiracy)
        }
      } catch {
        // degrade gracefully — still return the URL with empty claims
      }

      return { url: result.url, claims, screenshot }
    })
  )

  return sources
}

function extractClaims(markdown: string, conspiracy: string): string[] {
  const keywords = conspiracy.toLowerCase().split(' ').filter((w) => w.length > 3)
  const sentences = markdown
    .replace(/#+[^\n]*/g, '')
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 300)

  const matching = sentences.filter((s) => keywords.some((kw) => s.toLowerCase().includes(kw)))
  // fill remaining slots with any substantive sentence so pages aren't empty
  const matchingSet = new Set(matching)
  const fillers = sentences.filter((s) => !matchingSet.has(s))

  return [...matching.slice(0, 4), ...fillers.slice(0, 2)].slice(0, 5)
}
