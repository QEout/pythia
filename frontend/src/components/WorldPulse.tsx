import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import IntelMap from './IntelMap'

interface Props {
  data: any
  onRefresh?: () => void
}

function severity(count: number, thresholds: [number, number, number]): { level: string; color: string; bg: string; border: string } {
  if (count >= thresholds[2]) return { level: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' }
  if (count >= thresholds[1]) return { level: 'HIGH',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' }
  if (count >= thresholds[0]) return { level: 'ELEVATED', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.25)' }
  return { level: 'NORMAL', color: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.2)' }
}

function SeverityBadge({ level, color }: { level: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase"
      style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ backgroundColor: color }} />
      {level}
    </span>
  )
}

interface PanelProps {
  title: string
  icon: string
  count: number
  severityThresholds: [number, number, number]
  children: React.ReactNode
}

function IntelPanel({ title, icon, count, severityThresholds, children }: PanelProps) {
  const sev = severity(count, severityThresholds)
  return (
    <div className="flex flex-col overflow-hidden rounded-none"
      style={{ background: '#141414', border: `1px solid ${sev.border}`, minHeight: 240, maxHeight: 280 }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b shrink-0"
        style={{ borderColor: '#2a2a2a', background: sev.bg }}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-[10px] font-semibold text-zinc-200 tracking-wide uppercase">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500">{count}</span>
          <SeverityBadge level={sev.level} color={sev.color} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0" style={{ scrollbarGutter: 'stable' }}>
        {children}
      </div>
    </div>
  )
}

function IntelItem({ text, sub, severity: sev }: { text: string; sub?: string; severity?: string }) {
  const dotColor = sev === 'critical' || sev === 'red' ? '#ef4444'
    : sev === 'high' || sev === 'orange' ? '#f59e0b'
    : sev === 'medium' ? '#06b6d4' : '#3f3f46'
  return (
    <div className="flex items-start gap-1.5 py-0.5 px-0.5 rounded hover:bg-white/[0.02] transition-colors">
      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: dotColor }} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-zinc-300 font-mono leading-relaxed line-clamp-2">{text}</span>
        {sub && <span className="text-[9px] text-zinc-600 font-mono block">{sub}</span>}
      </div>
    </div>
  )
}

function StockItem({ item }: { item: any }) {
  const pct = item.change_pct ?? 0
  const color = pct > 0 ? '#22c55e' : pct < 0 ? '#ef4444' : '#71717a'
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '–'
  return (
    <div className="flex items-center justify-between py-0.5 px-1 hover:bg-white/[0.02] transition-colors">
      <span className="text-[10px] font-mono text-zinc-400 w-14">{item.symbol}</span>
      <span className="text-[10px] font-mono text-zinc-300">${item.price?.toFixed(2)}</span>
      <span className="text-[10px] font-mono w-16 text-right" style={{ color }}>
        {arrow} {Math.abs(pct).toFixed(2)}%
      </span>
    </div>
  )
}

function FredItem({ item }: { item: any }) {
  const change = item.change || ''
  const color = change.includes('↑') ? '#22c55e' : change.includes('↓') ? '#ef4444' : '#71717a'
  return (
    <div className="flex items-center justify-between py-0.5 px-1 hover:bg-white/[0.02] transition-colors">
      <span className="text-[10px] font-mono text-zinc-400 flex-1 truncate">{item.title?.split(':')[0]}</span>
      <span className="text-[10px] font-mono text-zinc-300 mx-2">{item.value?.toFixed?.(2) ?? item.value}</span>
      <span className="text-[10px] font-mono" style={{ color }}>{change}</span>
    </div>
  )
}

function NewsItem({ item, rank }: { item: any; rank: number }) {
  const catColor: Record<string, string> = {
    geopolitics: '#ef4444', defense: '#f97316', defense_security: '#f97316',
    finance: '#22c55e', tech: '#3b82f6', health: '#a855f7',
    cyber: '#06b6d4', energy: '#eab308', africa: '#f59e0b',
    latin_america: '#14b8a6', think_tanks: '#8b5cf6', india_south_asia: '#ec4899',
    mena: '#f97316', asia: '#06b6d4', science_climate: '#10b981',
  }
  const color = catColor[item.category] ?? '#71717a'
  return (
    <div className="flex items-start gap-1.5 py-0.5 px-0.5 hover:bg-white/[0.02] transition-colors">
      <span className="text-[9px] font-mono text-zinc-600 w-4 shrink-0 text-right mt-0.5">{rank}</span>
      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-zinc-300 font-mono leading-relaxed line-clamp-2">{item.title}</span>
        <span className="text-[8px] font-mono" style={{ color }}>{item.category?.replace('_', ' ')}</span>
      </div>
    </div>
  )
}

export default function WorldPulse({ data, onRefresh }: Props) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  if (!data) return null

  const earthquakes = data.earthquakes ?? []
  const climate = data.climate ?? []
  const disruptions = data.disruptions ?? []
  const markets = data.markets ?? []
  const conflicts = data.conflicts ?? []
  const polymarket = data.prediction_markets ?? []
  const fires = data.fires ?? []
  const news = data.news_headlines ?? []
  const stocks = data.stocks ?? []
  const fred = data.fred ?? []
  const who = data.who ?? []

  const totalSignals = earthquakes.length + climate.length + disruptions.length + conflicts.length + fires.length + who.length
  const globalSev = severity(totalSignals, [10, 25, 50])

  return (
    <div className="space-y-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 rounded"
        style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-3">
          <span className="text-lg">🌍</span>
          <div>
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{t('sections.worldPulse')}</h2>
            <span className="text-[9px] text-zinc-600 font-mono">{totalSignals} signals · {new Date().toISOString().slice(11, 19)} UTC</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SeverityBadge level={globalSev.level} color={globalSev.color} />
          {onRefresh && (
            <button onClick={onRefresh} className="text-zinc-600 hover:text-zinc-300 transition">
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <IntelMap data={data} />

      {/* Signal ribbon — 9 categories */}
      <div className="grid grid-cols-9 gap-1">
        {[
          { icon: '🌋', label: isZh ? '地震' : 'Seismic',     count: earthquakes.length, th: [5, 15, 30] as [number, number, number] },
          { icon: '🌡️', label: isZh ? '气候' : 'Climate',     count: climate.length,     th: [3, 8, 15]  as [number, number, number] },
          { icon: '⚠️', label: isZh ? '灾害' : 'Disasters',   count: disruptions.length, th: [2, 5, 10]  as [number, number, number] },
          { icon: '⚔️', label: isZh ? '冲突' : 'Conflicts',   count: conflicts.length,   th: [3, 10, 20] as [number, number, number] },
          { icon: '🔥', label: isZh ? '火点' : 'Fires',       count: fires.length,       th: [5, 15, 30] as [number, number, number] },
          { icon: '📊', label: isZh ? '市场' : 'Markets',     count: markets.length,     th: [1, 2, 3]   as [number, number, number] },
          { icon: '🎯', label: isZh ? '预测' : 'Prediction',  count: polymarket.length,  th: [3, 8, 15]  as [number, number, number] },
          { icon: '🏥', label: isZh ? '健康' : 'Health',      count: who.length,         th: [2, 5, 10]  as [number, number, number] },
          { icon: '💹', label: isZh ? '股票' : 'Stocks',      count: stocks.length,      th: [5, 10, 15] as [number, number, number] },
        ].map((s, i) => {
          const sev = severity(s.count, s.th)
          return (
            <div key={i} className="text-center py-1.5 rounded-sm" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="text-sm mb-0.5">{s.icon}</div>
              <div className="text-base font-bold font-mono" style={{ color: sev.color }}>{s.count}</div>
              <div className="text-[7px] text-zinc-600 font-mono uppercase">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Dense panel grid — 11 panels */}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {/* News Feed — ranked headlines */}
        <IntelPanel title={isZh ? '新闻头条' : 'News Feed'} icon="📰" count={news.length} severityThresholds={[10, 30, 60]}>
          {news.slice(0, 20).map((n: any, i: number) => (
            <NewsItem key={i} item={n} rank={i + 1} />
          ))}
          {news.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>

        {/* Stock Quotes */}
        <IntelPanel title={isZh ? '实时股票' : 'Stock Quotes'} icon="💹" count={stocks.length} severityThresholds={[5, 10, 15]}>
          {stocks.slice(0, 15).map((s: any, i: number) => (
            <StockItem key={i} item={s} />
          ))}
          {stocks.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO API KEY</div>}
        </IntelPanel>

        {/* Macro Economy */}
        <IntelPanel title={isZh ? '宏观经济' : 'Macro Economy'} icon="📈" count={fred.length} severityThresholds={[3, 5, 8]}>
          {fred.map((f: any, i: number) => (
            <FredItem key={i} item={f} />
          ))}
          {fred.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO API KEY</div>}
        </IntelPanel>

        {/* Health Alerts */}
        <IntelPanel title={isZh ? '健康预警' : 'Health Alerts'} icon="🏥" count={who.length} severityThresholds={[2, 5, 10]}>
          {who.slice(0, 12).map((w: any, i: number) => (
            <IntelItem key={i} text={w.title} sub={w.date} severity={w.severity ?? 'medium'} />
          ))}
          {who.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>

        {/* Earthquakes */}
        <IntelPanel title={t('world.earthquakes')} icon="🌋" count={earthquakes.length} severityThresholds={[5, 15, 30]}>
          {earthquakes.slice(0, 12).map((q: any, i: number) => {
            const mag = q.magnitude ?? 0
            const sev = mag >= 5 ? 'critical' : mag >= 3.5 ? 'high' : 'medium'
            return <IntelItem key={i} text={`M${mag.toFixed(1)} ${q.title ?? q.location ?? ''}`} sub={q.time} severity={sev} />
          })}
          {earthquakes.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>

        {/* Conflicts */}
        <IntelPanel title={t('world.conflicts')} icon="⚔️" count={conflicts.length} severityThresholds={[3, 10, 20]}>
          {conflicts.slice(0, 12).map((c: any, i: number) => (
            <IntelItem key={i} text={c.title} sub={c.fatalities ? `${c.fatalities} ${t('world.casualties')}` : c.country} severity={c.severity ?? 'medium'} />
          ))}
          {conflicts.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>

        {/* Active Fires */}
        <IntelPanel title={t('world.fires')} icon="🔥" count={fires.length} severityThresholds={[5, 15, 30]}>
          {fires.slice(0, 12).map((f: any, i: number) => (
            <IntelItem key={i} text={f.title} severity={f.severity ?? 'medium'} />
          ))}
          {fires.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>

        {/* Disruptions */}
        <IntelPanel title={t('world.disruptions')} icon="⚠️" count={disruptions.length} severityThresholds={[2, 5, 10]}>
          {disruptions.slice(0, 12).map((d: any, i: number) => (
            <IntelItem key={i} text={d.title} sub={d.country} severity={d.severity ?? 'medium'} />
          ))}
          {disruptions.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>

        {/* Climate */}
        <IntelPanel title={t('world.climate')} icon="🌡️" count={climate.length} severityThresholds={[3, 8, 15]}>
          {climate.slice(0, 12).map((c: any, i: number) => (
            <IntelItem key={i} text={c.title ?? `${c.region}: ${c.temperature}°C`} sub={c.region} severity="medium" />
          ))}
          {climate.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>

        {/* Fear & Greed */}
        <IntelPanel title={t('world.fearGreed')} icon="📊" count={markets.length} severityThresholds={[1, 2, 3]}>
          {markets.slice(0, 10).map((m: any, i: number) => {
            const val = m.value ?? 0
            const sev = val < 25 ? 'critical' : val < 45 ? 'high' : val > 75 ? 'critical' : 'medium'
            return <IntelItem key={i} text={`${m.classification ?? m.title} — ${val}`} severity={sev} />
          })}
          {markets.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>

        {/* Prediction Markets */}
        <IntelPanel title={t('world.polymarket')} icon="🎯" count={polymarket.length} severityThresholds={[3, 8, 15]}>
          {polymarket.slice(0, 12).map((p: any, i: number) => (
            <IntelItem key={i} text={p.title?.slice(0, 80) ?? ''} sub={p.probability ? `${p.probability}` : undefined} severity="medium" />
          ))}
          {polymarket.length === 0 && <div className="text-[10px] text-zinc-700 text-center py-6 font-mono">NO DATA</div>}
        </IntelPanel>
      </div>

      <div className="text-[8px] text-zinc-700 text-right font-mono px-1">
        {t('world.dataAttribution')}
      </div>
    </div>
  )
}
