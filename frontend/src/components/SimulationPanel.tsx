import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts'
import { Activity, TrendingUp } from 'lucide-react'

interface Props {
  simulation?: {
    total_agents: number
    activation_pct: number
    avg_sentiment: number
    polarization_index?: number
    counter_narrative_strength?: number
    spread_history: { step: number; activation_pct: number; avg_sentiment: number; polarization?: number }[]
    group_breakdown: Record<string, { activated_pct: number; avg_sentiment: number; total: number; polarization?: number }>
    archetype_breakdown?: Record<string, { total: number; activated_pct: number; avg_opinion: number }>
  }
}

const ARCHETYPE_COLORS: Record<string, string> = {
  follower: 'bg-zinc-500',
  amplifier: 'bg-cyan-500',
  skeptic: 'bg-amber-500',
  contrarian: 'bg-red-500',
  opinion_leader: 'bg-violet-500',
}

function SentimentDot({ value }: { value: number }) {
  const color = value > 0.3 ? '#22c55e' : value > 0 ? '#06b6d4' : value > -0.3 ? '#f59e0b' : '#ef4444'
  const label = value > 0.3 ? '++' : value > 0 ? '+' : value > -0.3 ? '~' : '−'
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

export default function SimulationPanel({ simulation }: Props) {
  const { t } = useTranslation()

  if (!simulation) return (
    <section>
      <h2 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider flex items-center gap-2">
        <Activity size={12} />
        {t('sections.simulation')}
      </h2>
      <div className="bg-bg-card rounded-xl border border-border p-6 text-center text-zinc-600 text-sm">
        {t('sections.noData')}
      </div>
    </section>
  )

  const chartData = (simulation.spread_history ?? []).map(h => ({
    step: `H+${h.step}`,
    reach: h.activation_pct,
    sentiment: +(h.avg_sentiment * 100).toFixed(1),
    polarization: +((h.polarization ?? 0) * 100).toFixed(1),
  }))

  const groups = Object.entries(simulation.group_breakdown ?? {})
    .sort(([, a], [, b]) => b.activated_pct - a.activated_pct)

  const archetypes = Object.entries(simulation.archetype_breakdown ?? {})

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
        <Activity size={12} />
        {t('sections.simulation')}
      </h2>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-cyan-400 mono">{simulation.activation_pct}%</div>
          <div className="text-[9px] text-zinc-600">{t('stats.reached')}</div>
        </div>
        <div className="bg-bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-violet-400 mono">
            {(simulation.avg_sentiment * 100).toFixed(0)}
          </div>
          <div className="text-[9px] text-zinc-600">{t('sections.sentiment')}</div>
        </div>
        <div className="bg-bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-amber-400 mono">
            {((simulation.polarization_index ?? 0) * 100).toFixed(0)}
          </div>
          <div className="text-[9px] text-zinc-600">{t('stats.polarization')}</div>
        </div>
      </div>

      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-[10px] text-zinc-500 mb-3 font-semibold uppercase">{t('sections.spreadCurve')}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="step" tick={{ fill: '#3f3f46', fontSize: 9 }} axisLine={{ stroke: '#1e1e2e' }} />
            <YAxis tick={{ fill: '#3f3f46', fontSize: 9 }} tickFormatter={v => `${v}%`} axisLine={{ stroke: '#1e1e2e' }} />
            <Tooltip
              contentStyle={{ background: '#0c0c12', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#71717a' }}
            />
            <Area type="monotone" dataKey="reach" stroke="#06b6d4" fill="url(#reachGrad)" strokeWidth={2} name="Reach %" />
            <Line type="monotone" dataKey="sentiment" stroke="#8b5cf6" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Sentiment" />
            <Line type="monotone" dataKey="polarization" stroke="#f59e0b" strokeWidth={1} dot={false} name="Polarization" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {archetypes.length > 0 && (
        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-[10px] text-zinc-500 mb-3 font-semibold uppercase">{t('sections.archetypes')}</h3>
          <div className="space-y-2">
            {archetypes.map(([name, data]) => {
              const barColor = ARCHETYPE_COLORS[name] ?? 'bg-zinc-500'
              return (
                <div key={name} className="flex items-center gap-2 text-[10px]">
                  <span className="w-20 text-zinc-500 truncate text-right font-medium">
                    {t(`archetypes.${name}`, name)}
                  </span>
                  <div className="flex-1 bg-zinc-900 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                      style={{ width: `${data.activated_pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-zinc-500 font-mono">{data.activated_pct}%</span>
                  <SentimentDot value={data.avg_opinion} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-[10px] text-zinc-500 mb-3 font-semibold uppercase">{t('sections.sentiment')}</h3>
        <div className="space-y-2">
          {groups.map(([name, g]) => {
            const barColor = g.avg_sentiment > 0.2 ? 'bg-emerald-500' : g.avg_sentiment > -0.2 ? 'bg-cyan-500' : 'bg-red-500'
            return (
              <div key={name} className="flex items-center gap-2 text-[10px]">
                <span className="w-20 text-zinc-500 truncate text-right font-medium">
                  {t(`groups.${name}`, name)}
                </span>
                <div className="flex-1 bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                    style={{ width: `${g.activated_pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-zinc-500 font-mono">{g.activated_pct}%</span>
                <SentimentDot value={g.avg_sentiment} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
