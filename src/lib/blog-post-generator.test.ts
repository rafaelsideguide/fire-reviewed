import { describe, it, expect, vi } from 'vitest'
import { generateBlogPost } from './blog-post-generator'
import type { Source } from './types'

const CONSPIRACY = 'Birds Aren\'t Real'

const SOURCES: Source[] = [
  {
    url: 'https://infowars.com/birds-arent-real',
    tier: 'LEGENDARY',
    multiplier: 3,
    claims: ['Birds were replaced by drones in 1959', 'CIA memo confirms operation'],
    screenshot: '',
  },
  {
    url: 'https://reddit.com/r/birdsarentreal',
    tier: 'RARE',
    multiplier: 1.5,
    claims: ['Thousands of eyewitness accounts'],
    screenshot: '',
  },
]

describe('generateBlogPost', () => {
  it('includes the conspiracy name in the output', async () => {
    const generate = vi.fn().mockResolvedValue('# Birds Aren\'t Real: The Truth\n\nContent here.')
    const result = await generateBlogPost('claude', CONSPIRACY, SOURCES, generate)
    expect(result.toLowerCase()).toContain("birds aren't real")
  })

  it('includes all source URLs in the output', async () => {
    const generate = vi.fn().mockResolvedValue('Some blog content.')
    const result = await generateBlogPost('claude', CONSPIRACY, SOURCES, generate)
    for (const source of SOURCES) {
      expect(result).toContain(source.url)
    }
  })

  it('includes tier badges for each source', async () => {
    const generate = vi.fn().mockResolvedValue('Blog post.')
    const result = await generateBlogPost('claude', CONSPIRACY, SOURCES, generate)
    expect(result).toContain('LEGENDARY')
    expect(result).toContain('RARE')
  })

  it('includes the winning model byline', async () => {
    const generate = vi.fn().mockResolvedValue('Post content.')
    const result = await generateBlogPost('grok', CONSPIRACY, SOURCES, generate)
    expect(result).toContain('grok')
    expect(result).toContain('Peer Reviewed by Nobody')
  })

  it('passes the conspiracy and sources to the generate function', async () => {
    const generate = vi.fn().mockResolvedValue('content')
    await generateBlogPost('claude', CONSPIRACY, SOURCES, generate)

    expect(generate).toHaveBeenCalledTimes(1)
    const prompt: string = generate.mock.calls[0][0]
    expect(prompt).toContain(CONSPIRACY)
    expect(prompt).toContain('infowars.com/birds-arent-real')
    expect(prompt).toContain('LEGENDARY')
    expect(prompt).toContain('Birds were replaced by drones in 1959')
  })

  it('handles empty sources gracefully', async () => {
    const generate = vi.fn().mockResolvedValue('No evidence found but I still believe.')
    const result = await generateBlogPost('llama', CONSPIRACY, [], generate)
    expect(result).toBeTruthy()
    expect(result).toContain('llama')
  })
})
