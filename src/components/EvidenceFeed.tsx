'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Source } from '@/lib/types'

const TIER_COLORS: Record<Source['tier'], string> = {
  COMMON: 'border-gray-600 shadow-gray-600',
  RARE: 'border-blue-500 shadow-blue-500',
  EPIC: 'border-purple-500 shadow-purple-500',
  LEGENDARY: 'border-orange-500 shadow-orange-500',
  MYTHIC: 'border-red-500 shadow-red-500',
}

const TIER_TEXT_COLORS: Record<Source['tier'], string> = {
  COMMON: 'text-gray-400 bg-gray-900',
  RARE: 'text-blue-400 bg-blue-950',
  EPIC: 'text-purple-400 bg-purple-950',
  LEGENDARY: 'text-orange-400 bg-orange-950',
  MYTHIC: 'text-red-400 bg-red-950',
}

const TIER_SCALE: Record<Source['tier'], number> = {
  COMMON: 1,
  RARE: 1,
  EPIC: 1,
  LEGENDARY: 1.10,
  MYTHIC: 1.20,
}

interface Props {
  sources: Source[]
}

export default function EvidenceFeed({ sources }: Props) {
  const visible = [...sources].reverse()

  return (
    <div className="h-full flex flex-col overflow-hidden p-3">
      <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-2 flex-shrink-0">Evidence Feed</div>
      <div className="flex flex-col gap-2 overflow-y-auto min-h-0">
      <AnimatePresence initial={false}>
        {visible.map((source, i) => {
          const key = `${source.url}-${i}`
          const isLatest = i === 0
          const scale = TIER_SCALE[source.tier]
          const domain = (() => { try { return new URL(source.url).hostname } catch { return source.url } })()

          return (
            <motion.a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              key={key}
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ transform: `scale(${scale})` }}
              className={`
                relative rounded-lg border overflow-hidden flex-shrink-0 cursor-pointer
                hover:opacity-100 transition-opacity
                ${TIER_COLORS[source.tier]}
                ${isLatest ? `shadow-lg animate-pulse-border` : 'opacity-70'}
                ${source.tier === 'LEGENDARY' || source.tier === 'MYTHIC' ? 'shadow-lg' : ''}
              `}
            >
              {source.screenshot ? (
                <img
                  src={source.screenshot}
                  alt={domain}
                  className="w-full h-20 object-cover object-top"
                />
              ) : (
                <div className="w-full h-20 bg-gray-900 flex items-center justify-center text-gray-600 text-xs">
                  {domain}
                </div>
              )}
              <div className="p-2 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 truncate">{domain}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${TIER_TEXT_COLORS[source.tier]}`}>
                  {source.tier}
                </span>
              </div>
            </motion.a>
          )
        })}
      </AnimatePresence>
      </div>
    </div>
  )
}
