# Fire Reviewed

<video src="public/demo.mov" autoplay loop muted playsinline></video>

Multi-agent conspiracy research engine. Pick a conspiracy. Watch multiple AIs race to believe it. Find out which model is most gullible.

Powered by [Firecrawl](https://firecrawl.dev).

---

## How it works

1. Pick a conspiracy (or type your own)
2. Claude, GPT-4o, Grok, and Llama research it in parallel using Firecrawl — crawling real sites, taking screenshots, extracting evidence
3. Sources are scored by rarity: Common → Rare → Epic → Legendary → MYTHIC
4. A live chart tracks each model's "believers" count — from _weird uncle_ to _half the internet_
5. First model convinced stops. The winner writes the blog post.

Finding a `.gov` URL that accidentally supports the conspiracy shakes the entire screen.

---

## Conspiracies (pre-loaded)

- Birds Aren't Real
- Flat Earth
- Stanley Kubrick Directed the Moon Landing
- We Live in a Simulation
- Avril Lavigne Died in 2003 (and Was Replaced by a Clone)
- Bigfoot Is Real

---

## Stack

- Next.js (App Router)
- Firecrawl (search, crawl, screenshot, extract)
- Claude, GPT-4o, Grok, Llama 3.2 via Ollama
- Recharts + Framer Motion
- Server-Sent Events for live updates

---

## Running locally

```bash
git clone https://github.com/rafaelsideguide/fire-reviewed
cd fire-reviewed
cp .env.example .env.local
# fill in your API keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need:
- [Firecrawl API key](https://firecrawl.dev)
- Anthropic API key
- OpenAI API key
- xAI API key
- [Ollama](https://ollama.com) running locally with `llama3.2:1b` pulled (`ollama pull llama3.2:1b`)
