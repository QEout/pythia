import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import { Target, TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { toLocalDate } from '../utils/time'

interface AgentAccuracy {
  agent_name: string
  total: number
  hits: number
  misses: number
  accuracy: number
}

interface DomainAccuracy {
  domain: string
  total: number
  hits: number
  accuracy: number
}

interface RoundAccuracy {
  round_id: string
  total: number
  hits: number
  accuracy: number
  ts: string
}

interface VerifiedPrediction {
  prediction: string
  agent_name: string
  domain: string
  confidence: number
  verified: number
  verify_note: string
  ts: string
  verified_at: string
}

interface AccuracyData {
  total_verified: number
  hits: number
  misses: number
  pending: number
  overall_accuracy: number
  by_agent: AgentAccuracy[]
  by_domain: DomainAccuracy[]
  by_round: RoundAccuracy[]
  recent_verified: VerifiedPrediction[]
}

const DOMAIN_COLORS: Record<string, string> = {
  politics: '#8b5cf6', tech: '#06b6d4', opinion: '#f59e0b', finance: '#10b981',
  culture: '#ec4899', blackswan: '#ef4444', military: '#64748b', health: '#22d3ee',
  energy: '#84cc16', china: '#f97316', crypto: '#a78bfa', supply_chain: '#14b8a6',
}

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']

export default function AccuracyDashboard() {
  const { t } = useTranslation()
  const [data, setData] = useState<AccuracyData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/accuracy')
      if (resp.ok) setData(await resp.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin text-violet-400" size={32} />
      </div>
    )
  }

  if (!data || data.total_verified === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-zinc-400">
        <Clock size={48} className="text-zinc-600" />
        <p className="text-lg font-medium">{t('accuracy.noData')}</p>
        <p className="text-sm text-zinc-500 max-w-md text-center">{t('accuracy.noDataHint')}</p>
      </div>
    )
  }

  const pieData = [
    { name: t('accuracy.hit'), value: data.hits },
    { name: t('accuracy.miss'), value: data.misses },
    { name: t('accuracy.pending'), value: data.pending },
  ]

  const agentChartData = data.by_agent.map((a) => ({
    name: t(`agents.${a.agent_name}`) || a.agent_name,
    accuracy: a.accuracy,
    hits: a.hits,
    misses: a.misses,
    total: a.total,
  }))

  const roundChartData = [...data.by_round].reverse().map((r) => ({
    round: r.ts ? toLocalDate(r.ts) : r.round_id.slice(0, 12),
    accuracy: r.accuracy,
    total: r.total,
    hits: r.hits,
  }))

  const domainChartData = data.by_domain.map((d) => ({
    domain: t(`domains.${d.domain}`) || d.domain,
    accuracy: d.accuracy,
    total: d.total,
    hits: d.hits,
    color: DOMAIN_COLORS[d.domain] || '#71717a',
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Target size={20} />}
          label={t('accuracy.overallAccuracy')}
          value={`${data.overall_accuracy}%`}
          color="text-violet-400"
          bg="from-violet-500/10 to-violet-600/5"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label={t('accuracy.totalHits')}
          value={`${data.hits}`}
          sub={`/ ${data.total_verified} ${t('accuracy.verified')}`}
          color="text-emerald-400"
          bg="from-emerald-500/10 to-emerald-600/5"
        />
        <StatCard
          icon={<XCircle size={20} />}
          label={t('accuracy.totalMisses')}
          value={`${data.misses}`}
          color="text-red-400"
          bg="from-red-500/10 to-red-600/5"
        />
        <StatCard
          icon={<Clock size={20} />}
          label={t('accuracy.pendingVerify')}
          value={`${data.pending}`}
          color="text-amber-400"
          bg="from-amber-500/10 to-amber-600/5"
        />
      </div>

      {/* Charts row 1: Pie + Agent bar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">{t('accuracy.verdictBreakdown')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#e4e4e7' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Agent accuracy bar */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">{t('accuracy.byAgent')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={agentChartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" width={85} tick={{ fill: '#d4d4d8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#e4e4e7' }}
                formatter={(v: number) => [`${v}%`, t('accuracy.accuracy')]}
              />
              <Bar dataKey="accuracy" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2: Accuracy trend + Domain breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Round trend */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">{t('accuracy.trendByRound')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={roundChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="round" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#e4e4e7' }}
              />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name={t('accuracy.accuracy')} />
              <Line type="monotone" dataKey="total" stroke="#71717a" strokeDasharray="5 5" strokeWidth={1} dot={false} name={t('accuracy.totalPreds')} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Domain breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">{t('accuracy.byDomain')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={domainChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="domain" tick={{ fill: '#a1a1aa', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#e4e4e7' }}
                formatter={(v: number) => [`${v}%`, t('accuracy.accuracy')]}
              />
              <Bar dataKey="accuracy" barSize={22} radius={[4, 4, 0, 0]}>
                {domainChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent verified predictions table */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">{t('accuracy.recentVerified')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 text-xs border-b border-zinc-800">
                <th className="text-left py-2 px-3">{t('accuracy.status')}</th>
                <th className="text-left py-2 px-3">{t('accuracy.agent')}</th>
                <th className="text-left py-2 px-3">{t('accuracy.prediction')}</th>
                <th className="text-left py-2 px-3">{t('accuracy.domain')}</th>
                <th className="text-right py-2 px-3">{t('accuracy.conf')}</th>
                <th className="text-left py-2 px-3">{t('accuracy.note')}</th>
                <th className="text-right py-2 px-3">{t('accuracy.time')}</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_verified.map((p, i) => {
                const isHit = p.verified === 1
                const note = p.verify_note || ''
                const verdict = note.split(':')[0]?.toLowerCase() || ''
                const isPartial = verdict.includes('partial')
                return (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                    <td className="py-2.5 px-3">
                      {isHit ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPartial ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isPartial ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                          {isPartial ? t('accuracy.partial') : t('accuracy.hit')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                          <XCircle size={12} />
                          {t('accuracy.miss')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 font-medium">
                      {t(`agents.${p.agent_name}`) || p.agent_name}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 max-w-xs truncate" title={p.prediction}>
                      {p.prediction}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: (DOMAIN_COLORS[p.domain] || '#71717a') + '20',
                        color: DOMAIN_COLORS[p.domain] || '#a1a1aa',
                      }}>
                        {t(`domains.${p.domain}`) || p.domain}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs text-zinc-400">
                      {(p.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 text-xs max-w-xs truncate" title={p.verify_note}>
                      {p.verify_note?.slice(0, 80)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs text-zinc-500 font-mono whitespace-nowrap">
                      {toLocalDate(p.verified_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; bg: string
}) {
  return (
    <div className={`card p-4 bg-gradient-to-br ${bg} border border-zinc-800/50`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  )
}
