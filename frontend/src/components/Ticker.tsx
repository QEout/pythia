interface Props {
  worldData: any
}

interface TickerItem {
  icon: string
  text: string
  color: string
  bg: string
}

export default function Ticker({ worldData }: Props) {
  if (!worldData) return null

  const items: TickerItem[] = []

  for (const q of (worldData.earthquakes ?? []).slice(0, 4)) {
    const mag = q.magnitude ?? 0
    const color = mag >= 5 ? 'text-red-400' : mag >= 3 ? 'text-amber-400' : 'text-zinc-400'
    const bg = mag >= 5 ? 'bg-red-500/8' : mag >= 3 ? 'bg-amber-500/8' : 'bg-zinc-800/50'
    items.push({ icon: '🌋', text: `M${mag.toFixed(1)} ${q.location ?? q.title ?? ''}`, color, bg })
  }

  for (const m of (worldData.markets ?? []).slice(0, 2)) {
    const val = m.value ?? 0
    const color = val > 60 ? 'text-emerald-400' : val < 30 ? 'text-red-400' : 'text-amber-400'
    items.push({ icon: '📊', text: `${m.classification ?? m.title} ${val}`, color, bg: 'bg-zinc-800/50' })
  }

  for (const a of (worldData.disruptions ?? []).slice(0, 3)) {
    const color = a.severity === 'red' ? 'text-red-400' : a.severity === 'orange' ? 'text-amber-400' : 'text-zinc-400'
    items.push({ icon: '⚠️', text: a.title, color, bg: a.severity === 'red' ? 'bg-red-500/8' : 'bg-zinc-800/50' })
  }

  for (const c of (worldData.conflicts ?? []).slice(0, 2)) {
    items.push({ icon: '⚔️', text: c.title, color: 'text-red-300', bg: 'bg-red-500/8' })
  }

  for (const p of (worldData.prediction_markets ?? []).slice(0, 2)) {
    items.push({ icon: '🎯', text: `${p.title?.slice(0, 50)} ${p.probability ?? ''}`, color: 'text-violet-400', bg: 'bg-violet-500/8' })
  }

  for (const f of (worldData.fires ?? []).slice(0, 2)) {
    items.push({ icon: '🔥', text: f.title, color: 'text-orange-400', bg: 'bg-orange-500/8' })
  }

  if (items.length === 0) return null

  return (
    <div className="border-b border-border bg-bg/80 overflow-hidden">
      <div className="py-1.5 px-2 overflow-hidden">
        <div className="ticker-animate inline-flex gap-2 whitespace-nowrap">
          {[...items, ...items].map((item, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium ${item.bg} ${item.color} border border-border/50`}
            >
              <span>{item.icon}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
