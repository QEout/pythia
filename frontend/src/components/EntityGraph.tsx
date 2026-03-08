import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Network } from 'lucide-react'

interface Props {
  entities?: [string, number][]
}

const TYPE_STYLE: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  country:      { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',    glow: 'hover:shadow-blue-500/10' },
  person:       { bg: 'bg-purple-500/10',  border: 'border-purple-500/20', text: 'text-purple-400',  glow: 'hover:shadow-purple-500/10' },
  company:      { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',   text: 'text-cyan-400',    glow: 'hover:shadow-cyan-500/10' },
  organization: { bg: 'bg-teal-500/10',    border: 'border-teal-500/20',   text: 'text-teal-400',    glow: 'hover:shadow-teal-500/10' },
  crypto:       { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',  text: 'text-amber-400',   glow: 'hover:shadow-amber-500/10' },
  topic:        { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',   text: 'text-rose-400',    glow: 'hover:shadow-rose-500/10' },
  index:        { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',text: 'text-emerald-400', glow: 'hover:shadow-emerald-500/10' },
  event_type:   { bg: 'bg-red-500/10',     border: 'border-red-500/20',    text: 'text-red-400',     glow: 'hover:shadow-red-500/10' },
}

const TYPE_ICON: Record<string, string> = {
  country: '🌍', person: '👤', company: '🏢', organization: '🏛️',
  crypto: '₿', topic: '📌', index: '📈', event_type: '⚡',
}

export default function EntityGraph({ entities: propEntities }: Props) {
  const { t } = useTranslation()
  const [apiEntities, setApiEntities] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/entities').then(r => r.json()).then(setApiEntities).catch(() => {})
  }, [])

  const displayEntities = apiEntities.length > 0
    ? apiEntities.map((e: any) => ({ name: e.entity, type: e.entity_type, count: e.mention_count }))
    : (propEntities ?? []).map(([name, count]) => ({ name, type: 'topic', count }))

  const maxCount = Math.max(1, ...displayEntities.map(e => e.count ?? 1))

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-2">
          <Network size={12} />
          {t('sections.entities')}
        </h2>
        <span className="text-[10px] text-zinc-600 font-mono">{displayEntities.length} entities</span>
      </div>

      <div className="bg-bg-card rounded-xl border border-border p-5">
        {displayEntities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayEntities.map((e, i) => {
              const style = TYPE_STYLE[e.type] ?? TYPE_STYLE.topic
              const icon = TYPE_ICON[e.type] ?? '•'
              const intensity = Math.min(1, (e.count ?? 1) / maxCount)
              const fontSize = 10 + intensity * 5

              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${style.bg} ${style.border} ${style.text} ${style.glow} transition-all hover:shadow-lg cursor-default animate-slide-in`}
                  style={{ fontSize: `${fontSize}px`, animationDelay: `${i * 30}ms`, opacity: 0.5 + intensity * 0.5 }}
                >
                  <span className="text-xs">{icon}</span>
                  <span className="font-medium">{e.name}</span>
                  <span className="text-[8px] opacity-50 font-mono ml-0.5">×{e.count}</span>
                </span>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Network size={28} className="mx-auto text-zinc-800 mb-2" />
            <p className="text-xs text-zinc-600">{t('sections.noData')}</p>
          </div>
        )}
      </div>
    </section>
  )
}
