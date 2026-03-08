import { useTranslation } from 'react-i18next'
import { Users, Target, TrendingUp, Radio, Zap, Clock } from 'lucide-react'

interface Props {
  round: any
  agentScores: Record<string, any>
  consensusCount: number
}

function MiniRing({ value, color, size = 36 }: { value: number; color: string; size?: number }) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={2} className="text-zinc-800" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={2.5}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000 ease-out" />
    </svg>
  )
}

export default function StatsBar({ round, agentScores, consensusCount }: Props) {
  const { t } = useTranslation()

  const scores = Object.values(agentScores) as any[]
  const totalPreds = scores.reduce((s: number, a: any) => s + (a.total ?? 0), 0)
  const totalHits = scores.reduce((s: number, a: any) => s + (a.hits ?? 0), 0)
  const hitRate = totalPreds > 0 ? Math.round((totalHits / totalPreds) * 100) : 0
  const reachPct = round?.simulation?.activation_pct ?? 0

  const stats = [
    {
      label: t('stats.agents'),
      value: '1M',
      sub: t('stats.agentsSub'),
      icon: Users,
      color: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
      ring: null,
    },
    {
      label: t('stats.predictions'),
      value: String(consensusCount || 0),
      sub: t('stats.predictionsSub'),
      icon: Target,
      color: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      ring: null,
    },
    {
      label: t('stats.hitRate'),
      value: `${hitRate}%`,
      sub: `${totalHits}/${totalPreds}`,
      icon: TrendingUp,
      color: hitRate >= 60 ? 'text-emerald-400' : hitRate >= 30 ? 'text-amber-400' : 'text-red-400',
      iconBg: hitRate >= 60 ? 'bg-emerald-500/10' : hitRate >= 30 ? 'bg-amber-500/10' : 'bg-red-500/10',
      ring: { value: hitRate, color: hitRate >= 60 ? '#22c55e' : hitRate >= 30 ? '#f59e0b' : '#ef4444' },
    },
    {
      label: t('stats.reached'),
      value: `${reachPct}%`,
      sub: t('stats.reachedSub'),
      icon: Zap,
      color: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      ring: { value: reachPct, color: '#06b6d4' },
    },
    {
      label: t('stats.sources'),
      value: String(round?.source_count ?? 13),
      sub: t('stats.sourcesSub'),
      icon: Radio,
      color: 'text-teal-400',
      iconBg: 'bg-teal-500/10',
      ring: null,
    },
    {
      label: t('stats.lastRound'),
      value: round?.round_id?.slice(2, 10) ?? '—',
      sub: round?.ts ? new Date(round.ts).toLocaleTimeString() : '',
      icon: Clock,
      color: 'text-zinc-400',
      iconBg: 'bg-zinc-500/10',
      ring: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon
        return (
          <div
            key={i}
            className="group relative bg-bg-card rounded-xl border border-border hover:border-border-bright p-4 transition-all duration-300 hover:bg-bg-hover animate-slide-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                <Icon size={15} className={s.color} />
              </div>
              {s.ring && (
                <div className="relative">
                  <MiniRing value={s.ring.value} color={s.ring.color} />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                    {s.ring.value}
                  </span>
                </div>
              )}
            </div>
            <div className={`text-xl font-bold ${s.color} tracking-tight mono`}>{s.value}</div>
            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">{s.label}</div>
            {s.sub && <div className="text-[9px] text-zinc-600 mt-0.5">{s.sub}</div>}
          </div>
        )
      })}
    </div>
  )
}
