import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Radio, Clock, ExternalLink, X, Database } from 'lucide-react'

interface CacheEntry {
  key: string
  age_seconds: number
  ttl: number
  stale: boolean
}

interface SourceItem {
  title: string
  subtitle?: string
  url?: string
  category?: string
  raw?: any
}

interface SourceDetail {
  source: string
  count: number
  items: SourceItem[]
  error?: string
}

const SOURCE_META: Record<string, { icon: string; label: string; labelZh: string }> = {
  news:         { icon: '📰', label: 'NewsAPI + RSS',     labelZh: '新闻源 + RSS' },
  weibo:        { icon: '🇨🇳', label: 'Weibo Trends',     labelZh: '微博热搜' },
  trends:       { icon: '📈', label: 'Google Trends',     labelZh: '谷歌趋势' },
  crypto:       { icon: '₿',  label: 'CoinGecko',        labelZh: '加密货币' },
  finance:      { icon: '💹', label: 'Yahoo Finance',     labelZh: '雅虎财经' },
  worldmonitor: { icon: '🌍', label: 'USGS + GDACS',     labelZh: '地震 + 灾害' },
  acled:        { icon: '⚔️', label: 'ACLED Conflicts',   labelZh: '武装冲突' },
  gdelt:        { icon: '🔎', label: 'GDELT Events',      labelZh: 'GDELT事件' },
  polymarket:   { icon: '🎯', label: 'Polymarket',        labelZh: '预测市场' },
  fires:        { icon: '🔥', label: 'NASA FIRMS',        labelZh: 'NASA火点' },
  fred:         { icon: '📉', label: 'FRED Macro',        labelZh: 'FRED宏观经济' },
  who:          { icon: '🏥', label: 'WHO Alerts',        labelZh: 'WHO健康预警' },
  finnhub:      { icon: '💵', label: 'Finnhub Stocks',    labelZh: 'Finnhub股票' },
}

export default function SourceHealth() {
  const { t, i18n } = useTranslation()
  const [cacheData, setCacheData] = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [sourceDetail, setSourceDetail] = useState<SourceDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const r = await fetch('/api/cache')
      if (r.ok) {
        const data = await r.json()
        setCacheData(data.entries ?? [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (!selectedSource) return
    setDetailLoading(true)
    fetch(`/api/source/${selectedSource}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setSourceDetail(d))
      .catch(() => setSourceDetail(null))
      .finally(() => setDetailLoading(false))
  }, [selectedSource])

  const isZh = i18n.language === 'zh'
  const allSources = Object.entries(SOURCE_META)
  const cachedKeys = new Set(cacheData.map(e => e.key))

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <Radio size={12} className="text-teal-400" />
          {t('sections.sourceHealth')}
        </h2>
        <span className="text-[9px] text-zinc-600 font-mono">
          {cacheData.length}/{allSources.length} {t('sections.active')}
        </span>
      </div>

      <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {allSources.map(([key, meta]) => {
            const entry = cacheData.find(e => e.key === key)
            const isActive = !!entry
            const isStale = entry?.stale ?? false
            const age = entry ? Math.round(entry.age_seconds) : null

            return (
              <button
                key={key}
                onClick={() => setSelectedSource(key)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors text-left"
              >
                <span className="text-sm w-6 text-center">{meta.icon}</span>
                <span className="text-xs text-zinc-300 font-medium flex-1">
                  {isZh ? meta.labelZh : meta.label}
                </span>
                <span className="text-[9px] text-zinc-600 font-mono hidden sm:block">详情</span>
                {isActive ? (
                  <>
                    <div className="flex items-center gap-1 text-[9px] text-zinc-600">
                      <Clock size={9} />
                      {age !== null && (age < 60 ? `${age}s` : `${Math.round(age / 60)}m`)}
                    </div>
                    {isStale ? (
                      <span className="flex items-center gap-1 text-[9px] text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> STALE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" /> LIVE
                      </span>
                    )}
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] text-zinc-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" /> IDLE
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => setSelectedSource(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl h-full overflow-y-auto"
            style={{ background: '#0f0f11', borderLeft: '1px solid #27272a' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-cyan-400" />
                <div>
                  <div className="text-sm font-semibold text-zinc-200">
                    {isZh ? SOURCE_META[selectedSource]?.labelZh : SOURCE_META[selectedSource]?.label}
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono">
                    {detailLoading ? 'Loading...' : `${sourceDetail?.count ?? 0} items`}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedSource(null)} className="text-zinc-600 hover:text-white transition">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {detailLoading ? (
                <div className="text-[11px] text-zinc-500 font-mono">Loading source detail...</div>
              ) : sourceDetail?.items?.length ? (
                sourceDetail.items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-zinc-200 font-medium break-words">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-[10px] text-zinc-500 mt-1 break-words">{item.subtitle}</div>
                        )}
                        {item.category && (
                          <div className="text-[9px] text-cyan-400 font-mono mt-1 uppercase">{item.category}</div>
                        )}
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-200"
                        >
                          Link <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <pre className="mt-2 text-[9px] text-zinc-500 font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify(item.raw, null, 2)}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-zinc-500 font-mono">
                  {sourceDetail?.error || 'No data returned from this source.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
