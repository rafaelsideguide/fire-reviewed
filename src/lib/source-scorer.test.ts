import { describe, it, expect } from 'vitest'
import { scoreSource } from './source-scorer'

describe('scoreSource', () => {
  it('returns COMMON for an unknown blog URL', () => {
    const result = scoreSource('https://randomconspiracyjournal.com/birds')
    expect(result).toEqual({ tier: 'COMMON', multiplier: 1 })
  })

  it('returns RARE for reddit.com', () => {
    const result = scoreSource('https://reddit.com/r/conspiracy/comments/abc')
    expect(result).toEqual({ tier: 'RARE', multiplier: 1.5 })
  })

  it('returns RARE for quora.com', () => {
    const result = scoreSource('https://quora.com/Is-flat-earth-real')
    expect(result).toEqual({ tier: 'RARE', multiplier: 1.5 })
  })

  it('returns EPIC for youtube.com', () => {
    const result = scoreSource('https://www.youtube.com/watch?v=abc123')
    expect(result).toEqual({ tier: 'EPIC', multiplier: 2 })
  })

  it('returns EPIC for medium.com', () => {
    const result = scoreSource('https://medium.com/@truther/birds-exposed')
    expect(result).toEqual({ tier: 'EPIC', multiplier: 2 })
  })

  it('returns LEGENDARY for infowars.com', () => {
    const result = scoreSource('https://www.infowars.com/posts/birds-arent-real')
    expect(result).toEqual({ tier: 'LEGENDARY', multiplier: 3 })
  })

  it('returns LEGENDARY for naturalnews.com', () => {
    const result = scoreSource('https://naturalnews.com/birds-surveillance')
    expect(result).toEqual({ tier: 'LEGENDARY', multiplier: 3 })
  })

  it('returns LEGENDARY for bibliotecapleyades.net', () => {
    const result = scoreSource('https://bibliotecapleyades.net/ciencia/esp_ciencia100.htm')
    expect(result).toEqual({ tier: 'LEGENDARY', multiplier: 3 })
  })

  it('returns MYTHIC for a .gov URL', () => {
    const result = scoreSource('https://fbi.gov/files/bird-surveillance-program')
    expect(result).toEqual({ tier: 'MYTHIC', multiplier: 5 })
  })

  it('returns MYTHIC for a .edu URL', () => {
    const result = scoreSource('https://mit.edu/research/avian-drones')
    expect(result).toEqual({ tier: 'MYTHIC', multiplier: 5 })
  })

  it('handles subdomains correctly — subdomain of LEGENDARY domain stays LEGENDARY', () => {
    const result = scoreSource('https://feeds.infowars.com/rss')
    expect(result).toEqual({ tier: 'LEGENDARY', multiplier: 3 })
  })

  it('returns MYTHIC over RARE for a .gov URL on reddit — edge case never happens but MYTHIC wins', () => {
    // .gov takes precedence
    const result = scoreSource('https://data.gov/dataset/bird-counts')
    expect(result).toEqual({ tier: 'MYTHIC', multiplier: 5 })
  })
})
