import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface Props {
  analyses: any[]
  scores: Record<string, any>
}

const DOMAIN_STYLE: Record<string, { gradient: string; border: string; glow: string; badge: string }> = {
  politics: {
    gradient: 'from-violet-600/20 via-violet-500/5 to-transparent',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    glow: 'shadow-violet-500/5',
    badge: 'bg-violet-500/15 text-violet-400',
  },
  tech: {
    gradient: 'from-cyan-600/20 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    glow: 'shadow-cyan-500/5',
    badge: 'bg-cyan-500/15 text-cyan-400',
  },
  opinion: {
    gradient: 'from-amber-600/20 via-amber-500/5 to-transparent',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    glow: 'shadow-amber-500/5',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  finance: {
    gradient: 'from-emerald-600/20 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    glow: 'shadow-emerald-500/5',
    badge: 'bg-emerald-500/15 text-emerald-400',
  },
  culture: {
    gradient: 'from-pink-600/20 via-pink-500/5 to-transparent',
    border: 'border-pink-500/20 hover:border-pink-500/40',
    glow: 'shadow-pink-500/5',
    badge: 'bg-pink-500/15 text-pink-400',
  },
  blackswan: {
    gradient: 'from-red-600/20 via-red-500/5 to-transparent',
    border: 'border-red-500/20 hover:border-red-500/40',
    glow: 'shadow-red-500/5',
    badge: 'bg-red-500/15 text-red-400',
  },
}

function AccuracyRing({ value, size = 44 }: { value: number | null; size?: number }) {
  const r = (size - 5) / 2
  const circ = 2 * Math.PI * r
  const pct = value ?? 0
  const offset = circ - (pct / 100) * circ
  const color = value === null ? '#3f3f46'
    : pct >= 70 ? '#22c55e'
    : pct >= 40 ? '#f59e0b'
    : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth={3} />
        {value !== null && (
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

export default function AgentGrid({ analyses, scores }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!analyses.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          {t('sections.chiefAgents')}
        </h2>
        <span className="text-[10px] text-zinc-600">{analyses.length} {t('sections.active')}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {analyses.map((ca, i) => {
          const preds = ca.output?.predictions ?? []
          const score = scores[ca.agent]
          const acc = score?.total > 0 ? Math.round(score.accuracy * 100) : null
          const style = DOMAIN_STYLE[ca.domain] ?? DOMAIN_STYLE.politics
          const isExpanded = expanded === ca.agent

          return (
            <div
              key={ca.agent}
              className={`relative rounded-xl border bg-bg-card overflow-hidden transition-all duration-300 cursor-pointer animate-slide-in hover:shadow-lg ${style.border} ${style.glow}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => setExpanded(isExpanded ? null : ca.agent)}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${style.gradient} pointer-events-none`} />
              <div className="relative p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ca.emoji}</span>
                    <div>
                      <div className="font-semibold text-white text-sm leading-tight">
                        {String(t(`agents.${ca.agent}`, { defaultValue: ca.agent_cn ?? ca.agent }))}
                      </div>
                      <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded ${style.badge} font-medium`}>
                        {ca.domain}
                      </span>
                    </div>
                  </div>
                  <AccuracyRing value={acc} />
                </div>

                <div className="flex items-center gap-3 text-[10px] text-zinc-500 mb-2">
                  <span>{preds.length} {t('stats.predictions').toLowerCase()}</span>
                  {score?.total > 0 && (
                    <span>{score.hits}/{score.total} {t('stats.hitRate').toLowerCase()}</span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {ca.output?.analysis?.slice(0, 120) ?? ''}
                </p>

                {isExpanded && preds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in">
                    {preds.slice(0, 3).map((p: any, j: number) => (
                      <div key={j} className="text-[10px] text-zinc-400 flex items-start gap-2">
                        <span className="text-violet-400 font-mono shrink-0">
                          {Math.round((p.confidence ?? 0) * 100)}%
                        </span>
                        <span className="line-clamp-2">{p.prediction}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-center mt-2">
                  {isExpanded ? <ChevronUp size={12} className="text-zinc-600" /> : <ChevronDown size={12} className="text-zinc-600" />}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
