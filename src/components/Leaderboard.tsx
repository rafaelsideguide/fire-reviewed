'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Model } from '@/lib/types'

const MODEL_COLORS: Record<Model, string> = {
  claude: '#f97316',
  'gpt-4o': '#22c55e',
  grok: '#e2e8f0',
  llama: '#a855f7',
}

const MODEL_LABELS: Record<Model, string> = {
  claude: 'Claude',
  'gpt-4o': 'GPT-4o',
  grok: 'Grok',
  llama: 'Llama',
}

const MODEL_PERSONALITY: Record<Model, string> = {
  claude: 'Cautious. Corporate. Curious.',
  'gpt-4o': 'Confident. Occasionally wrong.',
  grok: 'Contrarian by design.',
  llama: 'Open source, open mind.',
}

// [floor, ceiling] for each milestone label
const MILESTONE_RANGE: Record<string, [number, number]> = {
  'Your weird uncle':        [0,           10],
  'Your coworkers':          [10,          100],
  'Local conspiracy meetup': [100,         1_000],
  'A subreddit':             [1_000,       10_000],
  'YouTube comment section': [10_000,      100_000],
  'Facebook group at 2am':   [100_000,     1_000_000],
  'Cable news segment':      [1_000_000,   10_000_000],
  'Trending on Twitter':     [10_000_000,  100_000_000],
  'Congressional hearing':   [100_000_000, 1_000_000_000],
  'Half the internet':       [1_000_000_000, 1_000_000_000],
}

export interface ModelScore {
  model: Model
  believers: number
  milestone: string
  done: boolean
  convictionReason?: string
  activityLog?: string[]
}

interface Props {
  scores: ModelScore[]
  raceOver?: boolean
}

export default function Leaderboard({ scores, raceOver = false }: Props) {
  const sorted = [...scores].sort((a, b) => {
    if (a.done !== b.done) return a.done ? -1 : 1
    return b.believers - a.believers
  })
  const leadingModel = sorted[0]?.model

  return (
    <div className="h-full flex flex-col p-3">
      <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-3">Leaderboard</div>
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {sorted.map((score, rank) => {
            const isLeading = score.model === leadingModel && score.believers > 0
            const color = MODEL_COLORS[score.model]

            const [floor, ceil] = MILESTONE_RANGE[score.milestone] ?? [0, 1]
            const progress = ceil === floor ? 1 : Math.min(1, (score.believers - floor) / (ceil - floor))

            return (
              <motion.div
                key={score.model}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  relative rounded-xl border overflow-hidden
                  ${isLeading ? 'border-orange-500 bg-gray-900' : 'border-gray-800 bg-gray-900/50'}
                `}
                style={isLeading ? { boxShadow: `0 0 20px ${color}33` } : {}}
              >
                {isLeading && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ background: `linear-gradient(to top, ${color}22, transparent)` }}
                  />
                )}

                <div className="p-3">
                  {/* header row */}
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color }}>
                        {rank === 0 && score.believers > 0 ? '👑 ' : ''}{MODEL_LABELS[score.model]}
                      </span>
                      {!score.done && !raceOver && (
                        <div
                          className="w-3 h-3 rounded-full border border-t-transparent animate-spin opacity-50"
                          style={{ borderColor: color, borderTopColor: 'transparent' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* personality */}
                  <div className="text-[10px] text-gray-600 mb-2">{MODEL_PERSONALITY[score.model]}</div>

                  {/* score */}
                  <motion.div
                    key={score.believers}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-black tabular-nums"
                    style={{ color }}
                  >
                    {score.believers.toLocaleString()}
                  </motion.div>

                  <div className="text-xs text-gray-500 mt-0.5 mb-2">able to convince: {score.milestone}</div>

                  {/* doubt meter */}
                  <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>

                  {/* activity log */}
                  {score.activityLog && score.activityLog.length > 0 && (
                    <div className="mt-2 border-t border-gray-800 pt-2 space-y-0.5">
                      {score.activityLog.slice(-3).map((line, i, arr) => (
                        <div
                          key={i}
                          className={`text-[10px] font-mono truncate ${i === arr.length - 1 ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BREAKING banner */}
                {score.done && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-red-900 bg-red-950 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded tracking-widest">BREAKING</span>
                      <span className="text-[10px] text-red-400 font-bold uppercase tracking-wide">Model convinced</span>
                    </div>
                    {score.convictionReason && (
                      <p className="text-[10px] text-red-300 italic leading-snug">
                        "{score.convictionReason}"
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
