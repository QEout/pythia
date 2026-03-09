import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, X, Newspaper, Brain, Target, History, AlertCircle, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { toLocalTime } from '../utils/time'

interface Props {
  analyses: any[]
  scores: Record<string, any>
}

const DOMAIN_STYLE: Record<string, { gradient: string; border: string; glow: string; badge: string; accent: string }> = {
  politics:      { gradient: 'from-violet-600/20 via-violet-500/5 to-transparent', border: 'border-violet-500/20 hover:border-violet-500/40', glow: 'shadow-violet-500/5', badge: 'bg-violet-500/15 text-violet-400', accent: '#8b5cf6' },
  tech:          { gradient: 'from-cyan-600/20 via-cyan-500/5 to-transparent', border: 'border-cyan-500/20 hover:border-cyan-500/40', glow: 'shadow-cyan-500/5', badge: 'bg-cyan-500/15 text-cyan-400', accent: '#06b6d4' },
  opinion:       { gradient: 'from-amber-600/20 via-amber-500/5 to-transparent', border: 'border-amber-500/20 hover:border-amber-500/40', glow: 'shadow-amber-500/5', badge: 'bg-amber-500/15 text-amber-400', accent: '#f59e0b' },
  finance:       { gradient: 'from-emerald-600/20 via-emerald-500/5 to-transparent', border: 'border-emerald-500/20 hover:border-emerald-500/40', glow: 'shadow-emerald-500/5', badge: 'bg-emerald-500/15 text-emerald-400', accent: '#10b981' },
  culture:       { gradient: 'from-pink-600/20 via-pink-500/5 to-transparent', border: 'border-pink-500/20 hover:border-pink-500/40', glow: 'shadow-pink-500/5', badge: 'bg-pink-500/15 text-pink-400', accent: '#ec4899' },
  blackswan:     { gradient: 'from-red-600/20 via-red-500/5 to-transparent', border: 'border-red-500/20 hover:border-red-500/40', glow: 'shadow-red-500/5', badge: 'bg-red-500/15 text-red-400', accent: '#ef4444' },
  military:      { gradient: 'from-slate-600/20 via-slate-500/5 to-transparent', border: 'border-slate-500/20 hover:border-slate-500/40', glow: 'shadow-slate-500/5', badge: 'bg-slate-500/15 text-slate-400', accent: '#94a3b8' },
  health:        { gradient: 'from-green-600/20 via-green-500/5 to-transparent', border: 'border-green-500/20 hover:border-green-500/40', glow: 'shadow-green-500/5', badge: 'bg-green-500/15 text-green-400', accent: '#22c55e' },
  energy:        { gradient: 'from-teal-600/20 via-teal-500/5 to-transparent', border: 'border-teal-500/20 hover:border-teal-500/40', glow: 'shadow-teal-500/5', badge: 'bg-teal-500/15 text-teal-400', accent: '#14b8a6' },
  china:         { gradient: 'from-red-600/20 via-orange-500/5 to-transparent', border: 'border-red-500/20 hover:border-red-500/40', glow: 'shadow-red-500/5', badge: 'bg-red-500/15 text-red-400', accent: '#ef4444' },
  crypto:        { gradient: 'from-orange-600/20 via-orange-500/5 to-transparent', border: 'border-orange-500/20 hover:border-orange-500/40', glow: 'shadow-orange-500/5', badge: 'bg-orange-500/15 text-orange-400', accent: '#f97316' },
  supply_chain:  { gradient: 'from-blue-600/20 via-blue-500/5 to-transparent', border: 'border-blue-500/20 hover:border-blue-500/40', glow: 'shadow-blue-500/5', badge: 'bg-blue-500/15 text-blue-400', accent: '#3b82f6' },
}

function AccuracyRing({ value, size = 44 }: { value: number | null; size?: number }) {
  const r = (size - 5) / 2
  const circ = 2 * Math.PI * r
  const pct = value ?? 0
  const offset = circ - (pct / 100) * circ
  const color = value === null ? '#3f3f46' : pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'
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

function OutcomeIcon({ outcome }: { outcome: string | null }) {
  if (outcome === 'hit') return <CheckCircle2 size={12} className="text-green-500" />
  if (outcome === 'miss') return <XCircle size={12} className="text-red-500" />
  if (outcome === 'partial') return <AlertCircle size={12} className="text-amber-500" />
  return <Clock size={12} className="text-zinc-600" />
}

interface AgentDetail {
  name: string
  name_cn: string
  emoji: string
  domain: string
  personality: string
  score: any
  memory: any[]
  recent_predictions: any[]
  domain_news: any[]
  related_entities: any[]
}

function AgentDetailPanel({ agentName, analysis, onClose }: { agentName: string; analysis: any; onClose: () => void }) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<AgentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'news' | 'memory' | 'predictions'>('news')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/agent/${agentName}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [agentName])

  const style = DOMAIN_STYLE[analysis?.domain] ?? DOMAIN_STYLE.politics
  const preds = analysis?.output?.predictions ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Drawer */}
      <div className="relative w-full max-w-lg h-full overflow-y-auto"
        style={{ background: '#0f0f11', borderLeft: `2px solid ${style.accent}30` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 border-b"
          style={{ background: '#0f0f11ee', borderColor: '#27272a', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{analysis?.emoji}</span>
              <div>
                <h2 className="text-base font-bold text-white">
                  {String(t(`agents.${agentName}`, { defaultValue: detail?.name_cn ?? agentName }))}
                </h2>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-mono ${style.badge}`}>
                  {analysis?.domain}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition p-1 rounded-lg hover:bg-white/5">
              <X size={18} />
            </button>
          </div>

          {/* Personality */}
          <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed italic">
            "{detail?.personality ?? '...'}"
          </p>

          {/* Score summary */}
          <div className="flex items-center gap-4 mt-3">
            <AccuracyRing value={detail && detail.score?.total > 0 ? Math.round((detail.score.accuracy ?? 0) * 100) : null} size={50} />
            <div className="flex-1 grid grid-cols-3 gap-2">
              {[
                { label: t('stats.predictions'), val: detail?.score?.total ?? 0 },
                { label: t('stats.hitRate'), val: detail?.score?.hits ?? 0 },
                { label: '准确率', val: detail?.score?.total ? `${Math.round((detail.score.accuracy ?? 0) * 100)}%` : '—' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-sm font-bold text-zinc-200 font-mono">{s.val}</div>
                  <div className="text-[8px] text-zinc-600 uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current analysis */}
        {analysis?.output?.analysis && (
          <div className="px-5 py-3 border-b" style={{ borderColor: '#1a1a1e' }}>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={12} style={{ color: style.accent }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: style.accent }}>
                {t('sections.currentAnalysis')}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{analysis.output.analysis}</p>
            {preds.length > 0 && (
              <div className="mt-3 space-y-2">
                {preds.map((p: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: `${style.accent}08`, border: `1px solid ${style.accent}15` }}>
                    <span className="text-xs font-bold font-mono shrink-0 mt-0.5" style={{ color: style.accent }}>
                      {Math.round((p.confidence ?? 0) * 100)}%
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-zinc-300 leading-relaxed">{p.prediction}</span>
                      {p.reasoning && <p className="text-[9px] text-zinc-600 mt-0.5">{p.reasoning}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {analysis.output?.dissent && (
              <div className="mt-2 text-[10px] text-zinc-600 italic flex items-start gap-1.5">
                <AlertCircle size={10} className="text-amber-600 mt-0.5 shrink-0" />
                <span>{analysis.output.dissent}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b" style={{ borderColor: '#1a1a1e' }}>
          {([
            { key: 'news' as const, icon: Newspaper, label: '相关新闻' },
            { key: 'memory' as const, icon: History, label: '记忆回溯' },
            { key: 'predictions' as const, icon: Target, label: '历史预测' },
          ]).map(tab => (
            <button key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                activeSection === tab.key ? 'border-b-2' : 'text-zinc-600 hover:text-zinc-400'
              }`}
              style={activeSection === tab.key ? { color: style.accent, borderColor: style.accent } : {}}>
              <tab.icon size={11} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${style.accent}30`, borderTopColor: style.accent }} />
            </div>
          ) : (
            <>
              {/* Related News */}
              {activeSection === 'news' && (
                <div className="space-y-1 animate-fade-in">
                  {(detail?.domain_news ?? []).length > 0 ? (
                    (detail?.domain_news ?? []).map((news, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-2 border-b border-zinc-900/50 group">
                        <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: style.accent }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-zinc-300 leading-relaxed group-hover:text-zinc-100 transition-colors">
                            {news.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${style.accent}12`, color: style.accent }}>
                              {news.category}
                            </span>
                            {news.time && <span className="text-[8px] text-zinc-700 font-mono">{toLocalTime(news.time)}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <Newspaper size={24} className="mx-auto text-zinc-800 mb-2" />
                      <p className="text-[10px] text-zinc-600">暂无相关新闻 — 触发预测后将自动收集</p>
                    </div>
                  )}

                  {/* Related entities */}
                  {(detail?.related_entities ?? []).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-900/50">
                      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">相关实体</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(detail?.related_entities ?? []).map((e: any, i: number) => (
                          <span key={i} className="text-[9px] px-2 py-1 rounded-full font-mono"
                            style={{ background: `${style.accent}10`, color: style.accent, border: `1px solid ${style.accent}20` }}>
                            {e.entity} ×{e.mention_count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Memory */}
              {activeSection === 'memory' && (
                <div className="space-y-1 animate-fade-in">
                  {(detail?.memory ?? []).length > 0 ? (
                    (detail?.memory ?? []).map((m, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-2 border-b border-zinc-900/50">
                        <OutcomeIcon outcome={m.outcome} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-zinc-300 leading-relaxed">{m.prediction}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono" style={{ color: style.accent }}>
                              {Math.round((m.confidence ?? 0) * 100)}%
                            </span>
                            <span className="text-[8px] text-zinc-700 font-mono">{toLocalTime(m.ts)}</span>
                            {m.outcome && (
                              <span className={`text-[8px] font-mono font-bold uppercase ${
                                m.outcome === 'hit' ? 'text-green-500' : m.outcome === 'miss' ? 'text-red-500' : 'text-amber-500'
                              }`}>{m.outcome}</span>
                            )}
                          </div>
                          {m.lesson && (
                            <p className="text-[9px] text-zinc-600 mt-1 flex items-start gap-1">
                              <Zap size={8} className="text-amber-600 mt-0.5 shrink-0" />
                              {m.lesson}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <History size={24} className="mx-auto text-zinc-800 mb-2" />
                      <p className="text-[10px] text-zinc-600">尚无记忆记录 — 首轮预测后开始积累</p>
                    </div>
                  )}
                </div>
              )}

              {/* Historical Predictions */}
              {activeSection === 'predictions' && (
                <div className="space-y-1 animate-fade-in">
                  {(detail?.recent_predictions ?? []).length > 0 ? (
                    (detail?.recent_predictions ?? []).map((p, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-2 border-b border-zinc-900/50">
                        <div className="mt-0.5">
                          {p.verified === 1 ? <CheckCircle2 size={12} className="text-green-500" />
                            : p.verified === 0 ? <XCircle size={12} className="text-red-500" />
                            : <Clock size={12} className="text-zinc-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-zinc-300 leading-relaxed">{p.prediction}</p>
                          {p.reasoning && <p className="text-[9px] text-zinc-600 mt-0.5">{p.reasoning}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono" style={{ color: style.accent }}>
                              {Math.round((p.confidence ?? 0) * 100)}%
                            </span>
                            <span className="text-[8px] text-zinc-700 font-mono">{toLocalTime(p.ts)}</span>
                            {p.verify_note && <span className="text-[8px] text-zinc-600 italic">— {p.verify_note}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <Target size={24} className="mx-auto text-zinc-800 mb-2" />
                      <p className="text-[10px] text-zinc-600">暂无历史预测</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AgentGrid({ analyses, scores }: Props) {
  const { t } = useTranslation()
  const [detailAgent, setDetailAgent] = useState<string | null>(null)

  if (!analyses.length) return null

  const detailAnalysis = detailAgent ? analyses.find(a => a.agent === detailAgent) : null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          {t('sections.chiefAgents')}
        </h2>
        <span className="text-[10px] text-zinc-600">{analyses.length} {t('sections.active')}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {analyses.map((ca, i) => {
          const preds = ca.output?.predictions ?? []
          const score = scores[ca.agent]
          const acc = score?.total > 0 ? Math.round(score.accuracy * 100) : null
          const style = DOMAIN_STYLE[ca.domain] ?? DOMAIN_STYLE.politics

          return (
            <div
              key={ca.agent}
              className={`relative rounded-xl border bg-bg-card overflow-hidden transition-all duration-300 cursor-pointer animate-slide-in hover:shadow-lg ${style.border} ${style.glow}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => setDetailAgent(ca.agent)}
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

                <div className="flex items-center justify-center mt-2 gap-1 text-[9px] text-zinc-600 group-hover:text-zinc-400 transition">
                  <span>点击查看详情</span>
                  <ChevronDown size={10} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Agent detail drawer */}
      {detailAgent && detailAnalysis && (
        <AgentDetailPanel
          agentName={detailAgent}
          analysis={detailAnalysis}
          onClose={() => setDetailAgent(null)}
        />
      )}
    </section>
  )
}
