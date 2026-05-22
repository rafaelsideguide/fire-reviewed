import type { Model, Source } from '@/lib/types'
import { generateBlogPost } from '@/lib/blog-post-generator'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export async function POST(req: Request) {
  const { model, conspiracy, sources }: { model: Model; conspiracy: string; sources: Source[] } =
    await req.json()

  const post = await generateBlogPost(model, conspiracy, sources, makeGenerateFn(model))

  return Response.json({ post })
}

function makeGenerateFn(model: Model) {
  return async (prompt: string): Promise<string> => {
    if (model === 'claude') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })
      return resp.content[0].type === 'text' ? resp.content[0].text : ''
    }

    if (model === 'gpt-4o') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })
      return resp.choices[0].message.content ?? ''
    }

    if (model === 'grok') {
      const grok = new OpenAI({ baseURL: 'https://api.x.ai/v1', apiKey: process.env.XAI_API_KEY })
      const resp = await grok.chat.completions.create({
        model: 'grok-3-mini',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })
      return resp.choices[0].message.content ?? ''
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
      return json?.message?.content ?? ''
    }

    return ''
  }
}
