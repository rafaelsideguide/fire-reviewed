'use client'

import { useState } from 'react'
import ConspiracySelector from '@/components/ConspiracySelector'
import RaceView from '@/components/RaceView'
import type { SkepticismLevel } from '@/lib/types'

export default function Home() {
  const [conspiracy, setConspiracy] = useState<string | null>(null)
  const [skepticism, setSkepticism] = useState<SkepticismLevel>('medium')

  if (!conspiracy) {
    return (
      <ConspiracySelector
        onStart={(c, s) => { setConspiracy(c); setSkepticism(s) }}
      />
    )
  }

  return (
    <RaceView
      conspiracy={conspiracy}
      skepticism={skepticism}
      onReset={() => setConspiracy(null)}
    />
  )
}
