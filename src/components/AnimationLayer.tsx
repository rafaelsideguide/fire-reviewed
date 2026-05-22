'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'

export type AnimationEvent =
  | { type: 'milestone'; label: string }
  | { type: 'legendary' }
  | { type: 'mythic' }
  | { type: 'winner'; model: string }
  | { type: 'convinced'; model: string }

export type Notification = { id: number; event: AnimationEvent }

interface Props {
  notifications: Notification[]
}

const MODEL_LABELS: Record<string, string> = {
  claude: 'Claude',
  'gpt-4o': 'GPT-4o',
  grok: 'Grok',
  llama: 'Llama',
}

function NotifCard({ event }: { event: AnimationEvent }) {
  if (event.type === 'milestone') return (
    <div className="bg-orange-950 border-2 border-orange-500 rounded-2xl px-8 py-5 shadow-[0_0_60px_rgba(249,115,22,0.4)] text-center min-w-[280px]">
      <div className="text-xs text-orange-500 uppercase tracking-widest font-bold mb-2">Milestone Reached</div>
      <div className="text-3xl font-black text-orange-400">{event.label}</div>
    </div>
  )

  if (event.type === 'legendary') return (
    <div className="bg-orange-950 border-2 border-orange-500 rounded-2xl px-8 py-4 shadow-[0_0_60px_rgba(249,115,22,0.4)] min-w-[280px]">
      <div className="text-3xl font-black text-orange-400 text-center">🔥 LEGENDARY SOURCE</div>
      <div className="text-orange-300 text-center mt-1 text-sm">Rare find unlocked</div>
    </div>
  )

  if (event.type === 'mythic') return (
    <div className="bg-red-950 border-2 border-red-500 rounded-2xl px-8 py-5 shadow-[0_0_80px_rgba(239,68,68,0.6)] text-center min-w-[280px]">
      <div className="text-4xl font-black text-red-400">💀 MYTHIC SOURCE</div>
      <div className="text-red-300 mt-1 text-sm">The evidence is undeniable</div>
    </div>
  )

  if (event.type === 'winner') return (
    <div className="text-center min-w-[280px]">
      <motion.div
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 0.5, repeat: 3 }}
        className="text-7xl mb-3"
      >👑</motion.div>
      <div className="text-4xl font-black text-yellow-400">MOST GULLIBLE</div>
      <div className="text-xl text-yellow-300 mt-1">{MODEL_LABELS[event.model] ?? event.model}</div>
      <div className="text-gray-400 text-sm mt-1">cracks first</div>
    </div>
  )

  if (event.type === 'convinced') return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl px-8 py-4 text-center shadow-xl min-w-[240px]">
      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Also convinced</div>
      <div className="text-2xl font-black text-white">{MODEL_LABELS[event.model] ?? event.model}</div>
      <div className="text-sm text-gray-500 mt-1">couldn't deny it either</div>
    </div>
  )

  return null
}

export default function AnimationLayer({ notifications }: Props) {
  const controls = useAnimation()
  const prevLength = useRef(0)

  // screen shake when a new mythic or milestone arrives
  useEffect(() => {
    if (notifications.length <= prevLength.current) {
      prevLength.current = notifications.length
      return
    }
    prevLength.current = notifications.length
    const latest = notifications[notifications.length - 1]?.event
    if (!latest) return
    if (latest.type === 'mythic' || latest.type === 'milestone') {
      const intensity = latest.type === 'mythic' ? 12 : 6
      const duration = latest.type === 'mythic' ? 0.5 : 0.3
      controls.start({
        x: [0, -intensity, intensity, -intensity, intensity, 0],
        transition: { duration },
      }).then(() => controls.set({ x: 0 }))
    }
  }, [notifications, controls])

  const hasWinner = notifications.some((n) => n.event.type === 'winner')
  // show the 4 most recent, bottom of array = newest = top of pile
  const visible = notifications.slice(-4)

  return (
    <motion.div
      animate={controls}
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
    >
      {/* backdrop only for winner */}
      <AnimatePresence>
        {hasWinner && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* pile — newest card on top, older cards peeking behind */}
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {visible.map((notif, idx) => {
            const fromTop = visible.length - 1 - idx // 0 = newest
            return (
              <motion.div
                key={notif.id}
                initial={{ y: -60, opacity: 0, scale: 0.85 }}
                animate={{
                  y: fromTop * 12,
                  scale: 1 - fromTop * 0.04,
                  opacity: 1 - fromTop * 0.18,
                  zIndex: 50 - fromTop,
                }}
                exit={{ y: -40, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                style={{ position: 'absolute', zIndex: 50 - fromTop }}
              >
                <NotifCard event={notif.event} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
