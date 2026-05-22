'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import EvidenceFeed from './EvidenceFeed'
import LivePlot, { type PlotDataPoint } from './LivePlot'
import Leaderboard, { type ModelScore } from './Leaderboard'
import AnimationLayer, { type AnimationEvent } from './AnimationLayer'
import BlogPost from './BlogPost'
import type { SSEEvent, Source, Model, Milestone, SkepticismLevel } from '@/lib/types'

const MODELS: Model[] = ['claude', 'gpt-4o', 'grok', 'llama']
const MODEL_LABELS: Record<Model, string> = { claude: 'Claude', 'gpt-4o': 'GPT-4o', grok: 'Grok', llama: 'Llama' }

interface Props {
  conspiracy: string
  skepticism: SkepticismLevel
  onReset: () => void
}

export default function RaceView({ conspiracy, skepticism, onReset }: Props) {
  const [allSources, setAllSources] = useState<Source[]>([])
  const [scores, setScores] = useState<ModelScore[]>(
    MODELS.map((m) => ({ model: m, believers: 0, milestone: 'Your weird uncle', done: false }))
  )
  const [plotData, setPlotData] = useState<PlotDataPoint[]>([])
  const [notifications, setNotifications] = useState<Array<{ id: number; event: AnimationEvent }>>([])
  const [blogPost, setBlogPost] = useState<string | null>(null)
  const [showBlog, setShowBlog] = useState(false)
  const [winnerModel, setWinnerModel] = useState<Model | null>(null)
  const [status, setStatus] = useState<'running' | 'done'>('running')

  const prevMilestones = useRef<Record<Model, Milestone>>({} as Record<Model, Milestone>)
  const allSourcesRef = useRef<Source[]>([])
  const winnerRef = useRef<Model | null>(null)
  const iterationRef = useRef(0)
  const notifId = useRef(0)

  const addNotif = useCallback((event: AnimationEvent) => {
    const id = ++notifId.current
    setNotifications((prev) => [...prev, { id, event }])
    const dur = event.type === 'winner' ? 5000 : event.type === 'convinced' ? 2500 : 3000
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), dur)
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()

    fetch('/api/race', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conspiracy, skepticism }),
      signal: ctrl.signal,
    }).then(async (res) => {
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          const dataLine = line.replace(/^data: /, '')
          if (!dataLine) continue
          try {
            const event: SSEEvent = JSON.parse(dataLine)
            handleEvent(event)
          } catch {}
        }
      }
      setStatus('done')
    }).catch(() => {})

    return () => ctrl.abort()
  }, [conspiracy])

  function handleEvent(event: SSEEvent) {
    const { model, believers, milestone, newSources, done } = event

    // Update sources
    setAllSources((prev) => {
      const updated = [...prev, ...newSources]
      allSourcesRef.current = updated
      return updated
    })

    // Trigger animations for tier
    for (const src of newSources) {
      if (src.tier === 'MYTHIC') addNotif({ type: 'mythic' })
      else if (src.tier === 'LEGENDARY') addNotif({ type: 'legendary' })
    }

    // Build activity log entry
    const domains = newSources.map((s) => {
      try { return new URL(s.url).hostname.replace(/^www\./, '') } catch { return s.url }
    })
    const logLine = done
      ? `Convicted after ${event.iteration} iterations`
      : newSources.length > 0
        ? `Found ${newSources.length}: ${domains.slice(0, 2).join(', ')}`
        : `[${event.iteration}] Searching deeper...`

    // Update scores
    setScores((prev) =>
      prev.map((s) =>
        s.model === model
          ? {
              ...s, believers, milestone, done,
              activityLog: [...(s.activityLog ?? []), logLine].slice(-20),
              ...(event.convictionReason ? { convictionReason: event.convictionReason } : {}),
            }
          : s
      )
    )

    // Milestone crossed?
    const prevMilestone = prevMilestones.current[model]
    if (prevMilestone !== milestone) {
      prevMilestones.current[model] = milestone
      if (prevMilestone) {
        addNotif({ type: 'milestone', label: milestone })
      }
    }

    // Update plot
    iterationRef.current++
    setPlotData((prev) => {
      const point: PlotDataPoint = { ...(prev[prev.length - 1] ?? {}), iteration: iterationRef.current }
      point[model] = believers
      return [...prev, point]
    })

    // Handle done
    if (done) {
      if (!winnerRef.current) {
        winnerRef.current = model
        setWinnerModel(model)
        addNotif({ type: 'winner', model })
        generateBlog(model)
      } else {
        addNotif({ type: 'convinced', model })
      }
    }
  }

  async function generateBlog(model: Model) {
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, conspiracy, sources: allSourcesRef.current }),
      })
      const { post } = await res.json()
      setBlogPost(post)
    } catch {}
  }

  const noConviction = status === 'done' && winnerModel === null
  const holdouts = status === 'done' && winnerModel !== null
    ? scores.filter((s) => !s.done).map((s) => s.model)
    : []

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div>
          <span className="text-xs text-gray-600 uppercase tracking-widest">Researching</span>
          <span className="ml-2 text-sm font-semibold text-orange-400">{conspiracy}</span>
        </div>
        <div className="flex items-center gap-3">
          {blogPost && (
            <button
              onClick={() => setShowBlog(true)}
              className="text-xs bg-orange-900 hover:bg-orange-800 text-orange-300 px-3 py-1 rounded-lg transition-colors"
            >
              📄 Read the Research
            </button>
          )}
          <button
            onClick={onReset}
            className="text-xs text-gray-600 hover:text-white transition-colors"
          >
            ← New race
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[25%_50%_25%] min-h-0">
        <div className="border-r border-gray-800 overflow-hidden">
          <EvidenceFeed sources={allSources} />
        </div>
        <div className="overflow-hidden">
          <LivePlot data={plotData} activeModels={MODELS} />
        </div>
        <div className="border-l border-gray-800 overflow-y-auto">
          <Leaderboard scores={scores} raceOver={status === 'done'} />
        </div>
      </div>

      <AnimationLayer notifications={notifications} />
      <BlogPost content={showBlog ? blogPost : null} onClose={() => setShowBlog(false)} />

      {noConviction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-sm w-full text-center space-y-4 shadow-2xl"
          >
            <div className="text-7xl select-none">😔</div>
            <h2 className="text-2xl font-black text-white">No model convinced</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              After exhaustive research, not a single AI cracked.
              The conspiracy remains... unproven.
            </p>
            <button
              onClick={onReset}
              className="mt-2 bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer w-full"
            >
              Try another conspiracy
            </button>
          </motion.div>
        </motion.div>
      )}

      {holdouts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-sm text-gray-400 shadow-xl"
        >
          🪨 <span className="font-semibold text-white">
            {holdouts.map((m) => MODEL_LABELS[m] ?? m).join(', ')}
          </span> {holdouts.length === 1 ? 'was' : 'were'} not convinced
        </motion.div>
      )}
    </div>
  )
}
