import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Languages, ArrowRight, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react'

interface Props {
  predictions: any[]
  type: 'consensus' | 'wildcard'
}

const DOMAIN_STYLE: Record<string, { border: string; text: string; bg: string; dot: string }> = {
  politics:     { border: 'border-l-violet-500',  text: 'text-violet-400',  bg: 'bg-violet-500/10',  dot: 'bg-violet-500' },
  tech:         { border: 'border-l-cyan-500',    text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    dot: 'bg-cyan-500' },
  technology:   { border: 'border-l-cyan-500',    text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    dot: 'bg-cyan-500' },
  opinion:      { border: 'border-l-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   dot: 'bg-amber-500' },
  finance:      { border: 'border-l-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  culture:      { border: 'border-l-pink-500',    text: 'text-pink-400',    bg: 'bg-pink-500/10',    dot: 'bg-pink-500' },
  blackswan:    { border: 'border-l-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10',     dot: 'bg-red-500' },
  military:     { border: 'border-l-slate-500',   text: 'text-slate-400',   bg: 'bg-slate-500/10',   dot: 'bg-slate-500' },
  health:       { border: 'border-l-green-500',   text: 'text-green-400',   bg: 'bg-green-500/10',   dot: 'bg-green-500' },
  energy:       { border: 'border-l-teal-500',    text: 'text-teal-400',    bg: 'bg-teal-500/10',    dot: 'bg-teal-500' },
  china:        { border: 'border-l-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10',     dot: 'bg-red-500' },
  crypto:       { border: 'border-l-orange-500',  text: 'text-orange-400',  bg: 'bg-orange-500/10',  dot: 'bg-orange-500' },
  supply_chain: { border: 'border-l-blue-500',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    dot: 'bg-blue-500' },
}

function ConfidenceArc({ value, size = 48 }: { value: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#06b6d4' : value >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e2e" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
        <span className="text-[7px] text-zinc-600">%</span>
      </div>
    </div>
  )
}

export default function PredictionList({ predictions, type }: Props) {
  const { t, i18n } = useTranslation()
  const [translating, setTranslating] = useState<number | null>(null)
  const [translations, setTranslations] = useState<Record<number, string>>({})
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const handleTranslate = async (idx: number, text: string) => {
    setTranslating(idx)
    try {
      const targetLang = i18n.language === 'zh' ? 'English' : '中文'
      const r = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_language: targetLang }),
      })
      if (r.ok) {
        const d = await r.json()
        setTranslations(prev => ({ ...prev, [idx]: d.translated }))
      }
    } catch { /* ignore */ }
    setTranslating(null)
  }

  if (!predictions.length) {
    if (type === 'wildcard') return null
    return (
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          {t('sections.consensus')}
        </h2>
        <div className="bg-bg-card rounded-xl border border-border p-8 text-center">
          <div className="text-4xl mb-3 opacity-30">🔮</div>
          <p className="text-zinc-500 text-sm">{t('sections.noData')}</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${type === 'wildcard' ? 'bg-red-500' : 'bg-cyan-500'}`} />
          {type === 'wildcard' && <AlertTriangle size={12} className="text-red-400" />}
          {t(type === 'consensus' ? 'sections.consensus' : 'sections.wildcards')}
        </h2>
        <span className="text-[10px] text-zinc-600 font-mono">{predictions.length} items</span>
      </div>
      <div className="space-y-2">
        {predictions.map((p, i) => {
          const domain = (p.domain ?? 'unknown').toLowerCase()
          const style = DOMAIN_STYLE[domain] ?? { border: 'border-l-zinc-500', text: 'text-zinc-400', bg: 'bg-zinc-500/10', dot: 'bg-zinc-500' }
          const conf = Math.round((p.confidence ?? 0) * 100)
          const isExpanded = expandedIdx === i

          return (
            <div
              key={i}
              className={`group bg-bg-card rounded-xl border border-border hover:border-border-bright border-l-[3px] ${style.border} transition-all duration-200 animate-slide-in cursor-pointer ${
                type === 'wildcard' ? 'ring-1 ring-red-500/10' : ''
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => setExpandedIdx(isExpanded ? null : i)}
            >
              <div className="flex items-start gap-4 p-4">
                <ConfidenceArc value={conf} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${style.bg} ${style.text}`}>
                      {String(t(`domains.${domain}`, domain))}
                    </span>
                    {(p.is_wildcard || type === 'wildcard') && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold flex items-center gap-1">
                        <AlertTriangle size={9} />
                        {t('wildcard')}
                      </span>
                    )}
                    <span className="text-[9px] text-zinc-600 ml-auto font-mono">#{i + 1}</span>
                  </div>

                  <p className="text-sm text-white/90 font-medium leading-relaxed">{p.prediction}</p>

                  {translations[i] && (
                    <p className="text-sm text-zinc-400 mt-2 pl-3 border-l-2 border-violet-500/30 leading-relaxed italic">
                      {translations[i]}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in">
                      {p.reasoning && (
                        <div className="text-[11px] text-zinc-500 leading-relaxed flex items-start gap-2">
                          <ArrowRight size={11} className="mt-0.5 text-zinc-600 shrink-0" />
                          {p.reasoning}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px]">
                        {p.supporters?.length > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400/70">
                            <ThumbsUp size={10} />
                            {p.supporters.join(', ')}
                          </span>
                        )}
                        {p.dissenters?.length > 0 && (
                          <span className="flex items-center gap-1 text-red-400/70">
                            <ThumbsDown size={10} />
                            {p.dissenters.join(', ')}
                          </span>
                        )}
                        {p.source_agent && (
                          <span className="text-violet-400/70">via {p.source_agent}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTranslate(i, p.prediction) }}
                      disabled={translating === i}
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-600 hover:text-violet-400 transition"
                    >
                      <Languages size={11} />
                      {translating === i ? '...' : t('sections.translate')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
