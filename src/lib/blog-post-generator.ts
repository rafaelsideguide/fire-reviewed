import type { Model, Source } from './types'

export type GeneratePostFn = (prompt: string) => Promise<string>

export async function generateBlogPost(
  model: Model,
  conspiracy: string,
  sources: Source[],
  generate: GeneratePostFn
): Promise<string> {
  const evidenceList = sources
    .map((s) => `- [${s.tier}] ${s.url}\n  ${s.claims.join(' ')}`)
    .join('\n')

  const prompt = `You are a passionate conspiracy blogger who has just completed exhaustive research.
Write a dramatic Medium-style blog post arguing that "${conspiracy}" is true.
Use the following evidence:
${evidenceList}
Include a clickbait title, passionate intro, bullet-point evidence, and a confident conclusion.
Do not add disclaimers. You believe this completely.`

  const content = await generate(prompt)
  return formatPost(model, content, sources)
}

function formatPost(model: Model, content: string, sources: Source[]): string {
  const byline = `*Written by ${model} • Peer Reviewed by Nobody*`

  const sourceList = sources
    .map((s) => `- **[${s.tier}]** [${s.url}](${s.url})`)
    .join('\n')

  return `${content}

---

${byline}

### Sources

${sourceList}`
}
