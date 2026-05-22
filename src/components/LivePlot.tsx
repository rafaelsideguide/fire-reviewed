'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Model, Milestone } from '@/lib/types'

const MODEL_COLORS: Record<Model, string> = {
  claude: '#f97316',
  'gpt-4o': '#22c55e',
  grok: '#e2e8f0',
  llama: '#a855f7',
}

const MILESTONES: { value: number; label: Milestone }[] = [
  { value: 1, label: 'Your weird uncle' },
  { value: 10, label: 'Your coworkers' },
  { value: 100, label: 'Local conspiracy meetup' },
  { value: 1_000, label: 'A subreddit' },
  { value: 10_000, label: 'YouTube comment section' },
  { value: 100_000, label: 'Facebook group at 2am' },
  { value: 1_000_000, label: 'Cable news segment' },
  { value: 10_000_000, label: 'Trending on Twitter' },
  { value: 100_000_000, label: 'Congressional hearing' },
  { value: 1_000_000_000, label: 'Half the internet' },
]

export type PlotDataPoint = {
  iteration: number
} & Partial<Record<Model, number>>

interface Props {
  data: PlotDataPoint[]
  activeModels: Model[]
}

function logTick(value: number): string {
  const m = MILESTONES.find((m) => m.value === value)
  return m ? m.label.split(' ').slice(0, 2).join(' ') : ''
}

export default function LivePlot({ data, activeModels }: Props) {
  const allVals = data
    .flatMap((pt) => activeModels.map((m) => (pt[m] ?? 0) as number))
    .filter((v) => v > 0)
  const maxVal = allVals.length > 0 ? Math.max(...allVals) : 5
  const minVal = allVals.length > 0 ? Math.min(...allVals) : 1

  // frame the data with 4x headroom above and below so lines fill the chart
  const domainTop = maxVal * 4
  const domainBottom = Math.max(1, minVal / 4)
  const visibleTicks = MILESTONES
    .filter((ms) => ms.value >= domainBottom && ms.value <= domainTop)
    .map((ms) => ms.value)

  return (
    <div className="h-full flex flex-col p-4">
      <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-4">Believers Race</div>

      <div className="flex gap-4 mb-4 flex-wrap">
        {activeModels.map((m) => (
          <span key={m} className="flex items-center gap-1.5 text-xs">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: MODEL_COLORS[m] }} />
            <span style={{ color: MODEL_COLORS[m] }}>{m}</span>
          </span>
        ))}
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="iteration"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              scale="log"
              domain={[domainBottom, domainTop]}
              ticks={visibleTicks}
              tickFormatter={logTick}
              tick={{ fill: '#6b7280', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value) => {
                const num = Number(value)
                const m = MILESTONES.slice().reverse().find((ms) => num >= ms.value)
                return [num.toLocaleString(), m?.label ?? '']
              }}
            />
            {activeModels.map((model) => (
              <Line
                key={model}
                type="monotone"
                dataKey={model}
                stroke={MODEL_COLORS[model]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
