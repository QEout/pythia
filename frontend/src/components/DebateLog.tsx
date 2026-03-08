import { useTranslation } from 'react-i18next'
import { Swords, MessageSquare, Languages } from 'lucide-react'
import { useState } from 'react'

interface Props {
  summary?: string
}

export default function DebateLog({ summary }: Props) {
  const { t, i18n } = useTranslation()
  const [translation, setTranslation] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)

  const handleTranslate = async () => {
    if (!summary || translating) return
    setTranslating(true)
    try {
      const target = i18n.language === 'zh' ? 'English' : '中文'
      const r = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summary, target_language: target }),
      })
      if (r.ok) {
        const d = await r.json()
        setTranslation(d.translated)
      }
    } catch { /* ignore */ }
    setTranslating(false)
  }

  const lines = (summary ?? '').split('\n').filter(Boolean)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <Swords size={12} className="text-amber-400" />
          {t('sections.debate')}
        </h2>
        {summary && (
          <button
            onClick={handleTranslate}
            disabled={translating}
            className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-violet-400 transition"
          >
            <Languages size={11} />
            {translating ? '...' : t('sections.translate')}
          </button>
        )}
      </div>

      <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
        {summary ? (
          <div className="p-5 space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="flex items-start gap-3 animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                <MessageSquare size={12} className="text-zinc-700 mt-0.5 shrink-0" />
                <p className="text-sm text-zinc-300 leading-relaxed">{line}</p>
              </div>
            ))}
            {translation && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[10px] text-violet-400 mb-2 font-semibold uppercase">{t('sections.translate')}</div>
                {translation.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-start gap-3 mb-2">
                    <MessageSquare size={12} className="text-violet-500/30 mt-0.5 shrink-0" />
                    <p className="text-sm text-zinc-400 leading-relaxed italic">{line}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Swords size={24} className="mx-auto text-zinc-800 mb-2" />
            <p className="text-sm text-zinc-600">{t('sections.waiting')}</p>
          </div>
        )}
      </div>
    </section>
  )
}
