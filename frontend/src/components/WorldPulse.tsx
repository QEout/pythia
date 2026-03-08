import { useTranslation } from 'react-i18next'
import { AlertTriangle, Activity } from 'lucide-react'

interface Props {
  data: any
}

const CATEGORY_STYLE: Record<string, { icon: string; iconColor: string; headerBg: string }> = {
  earthquakes: { icon: '🌋', iconColor: 'text-amber-400', headerBg: 'from-amber-500/10 to-transparent' },
  climate: { icon: '🌡️', iconColor: 'text-teal-400', headerBg: 'from-teal-500/10 to-transparent' },
  disruptions: { icon: '⚠️', iconColor: 'text-red-400', headerBg: 'from-red-500/10 to-transparent' },
  markets: { icon: '📊', iconColor: 'text-emerald-400', headerBg: 'from-emerald-500/10 to-transparent' },
  conflicts: { icon: '⚔️', iconColor: 'text-red-400', headerBg: 'from-red-500/10 to-transparent' },
  prediction_markets: { icon: '🎯', iconColor: 'text-violet-400', headerBg: 'from-violet-500/10 to-transparent' },
  fires: { icon: '🔥', iconColor: 'text-orange-400', headerBg: 'from-orange-500/10 to-transparent' },
}

interface DataCardProps {
  category: string
  title: string
  items: any[]
  renderer: (item: any) => React.ReactElement
}

function DataCard({ category, title, items, renderer }: DataCardProps) {
  const style = CATEGORY_STYLE[category] ?? { icon: '📡', iconColor: 'text-zinc-400', headerBg: 'from-zinc-500/10 to-transparent' }

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden group hover:border-border-bright transition-all">
      <div className={`bg-gradient-to-r ${style.headerBg} px-4 py-2.5 flex items-center justify-between border-b border-border`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{style.icon}</span>
          <h3 className="text-[11px] font-semibold text-zinc-300">{title}</h3>
        </div>
        <span className="text-[9px] text-zinc-600 font-mono">{items.length}</span>
      </div>
      <div className="p-3 space-y-1.5 max-h-44 overflow-y-auto">
        {items.length > 0 ? (
          items.slice(0, 8).map((item, i) => (
            <div key={i} className="text-[11px] text-zinc-400 flex items-start gap-2 py-0.5 hover:text-zinc-300 transition-colors">
              <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${style.iconColor.replace('text-', 'bg-')}`} />
              {renderer(item)}
            </div>
          ))
        ) : (
          <div className="text-[11px] text-zinc-700 text-center py-4">{style.icon} —</div>
        )}
      </div>
    </div>
  )
}

export default function WorldPulse({ data }: Props) {
  const { t } = useTranslation()
  if (!data) return null

  const quakeCount = (data.earthquakes ?? []).length
  const conflictCount = (data.conflicts ?? []).length
  const fireCount = (data.fires ?? []).length
  const alertLevel = conflictCount > 10 || quakeCount > 20 ? 'HIGH'
    : conflictCount > 5 || quakeCount > 10 ? 'ELEVATED' : 'NORMAL'
  const alertColor = alertLevel === 'HIGH' ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : alertLevel === 'ELEVATED' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'

  return (
    <section className="animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-slow" />
          {t('sections.worldPulse')}
        </h2>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border ${alertColor}`}>
          <AlertTriangle size={10} />
          {alertLevel}
        </div>
      </div>

      {/* Summary ribbon */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t('world.earthquakes'), count: quakeCount, color: 'text-amber-400', icon: '🌋' },
          { label: t('world.conflicts'), count: conflictCount, color: 'text-red-400', icon: '⚔️' },
          { label: t('world.fires'), count: fireCount, color: 'text-orange-400', icon: '🔥' },
          { label: t('world.disruptions'), count: (data.disruptions ?? []).length, color: 'text-red-400', icon: '⚠️' },
        ].map((s, i) => (
          <div key={i} className="bg-bg-card rounded-lg border border-border p-3 text-center">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className={`text-lg font-bold mono ${s.color}`}>{s.count}</div>
            <div className="text-[9px] text-zinc-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DataCard
          category="earthquakes"
          title={t('world.earthquakes')}
          items={data.earthquakes ?? []}
          renderer={q => (
            <span>
              <span className={`font-mono font-semibold ${(q.magnitude ?? 0) >= 5 ? 'text-red-400' : (q.magnitude ?? 0) >= 3 ? 'text-amber-400' : 'text-zinc-500'}`}>
                M{(q.magnitude ?? 0).toFixed(1)}
              </span>
              {' '}<span className="text-zinc-500">{q.title ?? q.location}</span>
            </span>
          )}
        />
        <DataCard
          category="climate"
          title={t('world.climate')}
          items={data.climate ?? []}
          renderer={c => <span>{c.title} <span className="text-zinc-600">{c.region}</span></span>}
        />
        <DataCard
          category="disruptions"
          title={t('world.disruptions')}
          items={data.disruptions ?? []}
          renderer={a => {
            const cls = a.severity === 'red' ? 'text-red-400' : a.severity === 'orange' ? 'text-amber-400' : 'text-zinc-400'
            return <span className={cls}>{a.title}</span>
          }}
        />
        <DataCard
          category="markets"
          title={t('world.fearGreed')}
          items={data.markets ?? []}
          renderer={m => {
            const cls = m.value > 50 ? 'text-emerald-400' : m.value < 30 ? 'text-red-400' : 'text-amber-400'
            return <span className={`font-semibold ${cls}`}>{m.title ?? m.classification} — {m.value}</span>
          }}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <DataCard
          category="conflicts"
          title={t('world.conflicts')}
          items={data.conflicts ?? []}
          renderer={c => (
            <span className={c.severity === 'critical' ? 'text-red-400' : c.severity === 'high' ? 'text-amber-400' : ''}>
              {c.title}
              {c.fatalities ? <span className="text-zinc-600 ml-1">({c.fatalities})</span> : ''}
            </span>
          )}
        />
        <DataCard
          category="prediction_markets"
          title={t('world.polymarket')}
          items={data.prediction_markets ?? []}
          renderer={m => (
            <span>
              <span className="text-violet-400">{m.title?.slice(0, 55)}</span>
              {m.probability && <span className="text-zinc-600 text-[9px] ml-1 font-mono">{m.probability}</span>}
            </span>
          )}
        />
        <DataCard
          category="fires"
          title={t('world.fires')}
          items={data.fires ?? []}
          renderer={f => (
            <span className={f.severity === 'critical' ? 'text-red-400' : f.severity === 'high' ? 'text-amber-400' : ''}>
              {f.title}
            </span>
          )}
        />
      </div>

      <p className="text-[8px] text-zinc-700 text-right font-mono">{t('world.dataAttribution')}</p>
    </section>
  )
}
