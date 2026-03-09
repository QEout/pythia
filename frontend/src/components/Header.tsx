import { useTranslation } from 'react-i18next'
import { Globe, Zap, Network, Activity, Radio, Clock, Target } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Props {
  connected: boolean
  predicting: boolean
  onPredict: () => void
  onToggleLang: () => void
  activeTab: string
  onTabChange: (tab: string) => void
  sourceCount?: number
  lastRoundTime?: string
}

const TABS = [
  { id: 'dashboard', icon: Activity, label: 'tabs.dashboard' },
  { id: 'world', icon: Globe, label: 'tabs.world' },
  { id: 'entities', icon: Network, label: 'tabs.entities' },
  { id: 'accuracy', icon: Target, label: 'tabs.accuracy' },
]

export default function Header({
  connected, predicting, onPredict, onToggleLang,
  activeTab, onTabChange, sourceCount, lastRoundTime,
}: Props) {
  const { t } = useTranslation()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const localTime = time.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="sticky top-0 z-50 border-b border-border">
      <div className="bg-bg/90 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-violet-500/30 border border-white/10">
                  P
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight leading-none">{t('app.title')}</h1>
                  <p className="text-[10px] text-zinc-500 hidden sm:block mt-0.5 font-medium">{t('app.subtitle')}</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-1 ml-4 text-[10px] text-zinc-600 font-mono">
                <Clock size={10} />
                <span>{localTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-3 mr-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-500'} animate-pulse-slow`} />
                  <span className={connected ? 'text-emerald-400/70' : 'text-red-400/70'}>
                    {connected ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>

                {sourceCount && (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Radio size={10} />
                    <span>{sourceCount} {t('stats.sources').toLowerCase()}</span>
                  </div>
                )}

                {lastRoundTime && (
                  <span className="text-zinc-600 font-mono">{lastRoundTime}</span>
                )}
              </div>

              <button
                onClick={onToggleLang}
                className="px-2.5 py-1.5 text-[11px] rounded-lg bg-zinc-800/40 text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-all border border-transparent hover:border-border"
              >
                {t('nav.language')}
              </button>

              <button
                onClick={onPredict}
                disabled={predicting}
                className={`group flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg font-semibold transition-all ${
                  predicting
                    ? 'bg-zinc-800 text-zinc-500 cursor-wait border border-border'
                    : 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30'
                }`}
              >
                {predicting ? (
                  <>
                    <Activity size={13} className="animate-spin" />
                    {t('nav.running')}
                  </>
                ) : (
                  <>
                    <Zap size={13} className="group-hover:animate-pulse" />
                    {t('nav.runPrediction')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                    active
                      ? 'border-violet-500 text-white bg-gradient-to-b from-violet-500/10 to-transparent'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-violet-400' : 'text-zinc-600'} />
                  {t(tab.label)}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
