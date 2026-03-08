import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Radio, CheckCircle, XCircle, Clock } from 'lucide-react'

interface CacheEntry {
  key: string
  age_seconds: number
  ttl: number
  stale: boolean
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
}

export default function SourceHealth() {
  const { t, i18n } = useTranslation()
  const [cacheData, setCacheData] = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(true)

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
              <div key={key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors">
                <span className="text-sm w-6 text-center">{meta.icon}</span>
                <span className="text-xs text-zinc-300 font-medium flex-1">
                  {isZh ? meta.labelZh : meta.label}
                </span>
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
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
