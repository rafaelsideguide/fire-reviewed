import type { Model, SSEEvent, SkepticismLevel } from '@/lib/types'
import { startRace } from '@/lib/agent-orchestrator'

export const dynamic = 'force-dynamic'

const MODELS: Model[] = ['claude', 'gpt-4o', 'grok', 'llama']

function sseMessage(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function POST(req: Request) {
  let conspiracy: string
  let skepticism: SkepticismLevel
  try {
    const body = await req.json()
    conspiracy = body.conspiracy
    skepticism = body.skepticism ?? 'medium'
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!conspiracy || typeof conspiracy !== 'string') {
    return new Response('Missing conspiracy', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { getResearchFn, getModelDecideFn } = await import('./deps')
        const deps = {
          research: getResearchFn(),
          modelDecide: getModelDecideFn(skepticism),
        }

        await startRace(conspiracy, MODELS, deps, (event) => {
          controller.enqueue(encoder.encode(sseMessage(event)))
        })
      } catch (err) {
        console.error('Race error:', err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
