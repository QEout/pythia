import { useTranslation } from 'react-i18next'
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, BarChart, Bar, Legend } from 'recharts'
import { Activity } from 'lucide-react'

interface Props {
  simulation?: {
    total_agents: number
    activation_pct: number
    avg_sentiment: number
    polarization_index?: number
    counter_narrative_strength?: number
    spread_history: { step: number; activation_pct: number; avg_sentiment: number; polarization?: number }[]
    process_history?: {
      step: number
      active_agents: number
      spreaders: number
      potential_reach: number
      contacts: number
      new_activated: number
      contrarian_activated: number
      trust_mean: number
      incoming_belief_mean: number
      counter_narrative: number
    }[]
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

function sentimentLabel(value: number): { text: string; color: string } {
  if (value > 0.3) return { text: '++', color: '#22c55e' }
  if (value > 0.05) return { text: '+', color: '#06b6d4' }
  if (value > -0.05) return { text: '~', color: '#71717a' }
  if (value > -0.3) return { text: '−', color: '#f59e0b' }
  return { text: '−−', color: '#ef4444' }
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
  const processData = (simulation.process_history ?? []).map(h => ({
    step: `H+${h.step}`,
    spreaders: h.spreaders,
    contacts: h.contacts,
    activated: h.new_activated,
    contrarian: h.contrarian_activated,
    trust: +(h.trust_mean * 100).toFixed(1),
    belief: +(h.incoming_belief_mean * 100).toFixed(1),
    counter: +(h.counter_narrative * 100).toFixed(1),
  }))

  const groups = Object.entries(simulation.group_breakdown ?? {})
    .sort(([, a], [, b]) => b.activated_pct - a.activated_pct)

  const archetypes = Object.entries(simulation.archetype_breakdown ?? {})

  const sent = sentimentLabel(simulation.avg_sentiment)

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
        <Activity size={12} />
        {t('sections.simulation')}
      </h2>

      {/* Top 3 KPI cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-cyan-400 mono">{simulation.activation_pct}%</div>
          <div className="text-[9px] text-zinc-600">{t('stats.reached')}</div>
        </div>
        <div className="bg-bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold mono" style={{ color: sent.color }}>
            {sent.text}
          </div>
          <div className="text-[9px] text-zinc-600">{t('sim.sentimentIndex')}</div>
        </div>
        <div className="bg-bg-card rounded-lg border border-border p-3 text-center">
          <div className="text-lg font-bold text-amber-400 mono">
            {((simulation.polarization_index ?? 0) * 100).toFixed(0)}
          </div>
          <div className="text-[9px] text-zinc-600">{t('stats.polarization')}</div>
        </div>
      </div>

      {/* Spread curve */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-[10px] text-zinc-500 mb-3 font-semibold uppercase">{t('sections.spreadCurve')}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData}>
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
            <Area type="monotone" dataKey="reach" stroke="#06b6d4" fill="url(#reachGrad)" strokeWidth={2} name={t('sim.reachPct')} />
            <Line type="monotone" dataKey="sentiment" stroke="#8b5cf6" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name={t('sim.sentimentLine')} />
            <Line type="monotone" dataKey="polarization" stroke="#f59e0b" strokeWidth={1} dot={false} name={t('sim.polarizationLine')} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Process charts */}
      {processData.length > 0 && (
        <>
          <div className="bg-bg-card rounded-xl border border-border p-4">
            <h3 className="text-[10px] text-zinc-500 mb-3 font-semibold uppercase">{t('sim.propagationProcess')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={processData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e1e2e' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e1e2e' }} />
                <Tooltip
                  contentStyle={{ background: '#0c0c12', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="spreaders" fill="#06b6d4" name={t('sim.spreaders')} radius={[3, 3, 0, 0]} />
                <Bar dataKey="activated" fill="#8b5cf6" name={t('sim.newActivated')} radius={[3, 3, 0, 0]} />
                <Bar dataKey="contrarian" fill="#ef4444" name={t('sim.contrarianActivated')} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-bg-card rounded-xl border border-border p-4">
            <h3 className="text-[10px] text-zinc-500 mb-3 font-semibold uppercase">{t('sim.mcIndicators')}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={processData}>
                <defs>
                  <linearGradient id="trustGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e1e2e' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e1e2e' }} />
                <Tooltip
                  contentStyle={{ background: '#0c0c12', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Area type="monotone" dataKey="trust" stroke="#22c55e" fill="url(#trustGrad)" strokeWidth={2} name={t('sim.avgTrust')} />
                <Line type="monotone" dataKey="belief" stroke="#eab308" strokeWidth={1.5} dot={false} name={t('sim.incomingBelief')} />
                <Line type="monotone" dataKey="counter" stroke="#ef4444" strokeWidth={1.5} dot={false} name={t('sim.counterNarrative')} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Archetype distribution */}
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

      {/* Group sentiment distribution */}
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
