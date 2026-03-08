import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useWebSocket } from './hooks/useWebSocket'
import { useApi } from './hooks/useApi'
import Header from './components/Header'
import Ticker from './components/Ticker'
import StatsBar from './components/StatsBar'
import AgentGrid from './components/AgentGrid'
import PredictionList from './components/PredictionList'
import SimulationPanel from './components/SimulationPanel'
import DebateLog from './components/DebateLog'
import WorldPulse from './components/WorldPulse'
import EntityGraph from './components/EntityGraph'
import SourceHealth from './components/SourceHealth'

interface PredictionRound {
  round_id: string
  ts: string
  source_count?: number
  entity_count?: number
  top_entities?: [string, number][]
  chief_analyses?: any[]
  roundtable: {
    consensus_predictions: any[]
    wildcards: any[]
    debate_summary: string
  }
  simulation: {
    total_agents: number
    activation_pct: number
    avg_sentiment: number
    spread_history: any[]
    group_breakdown: Record<string, any>
  }
}

export default function App() {
  const { i18n } = useTranslation()
  const [round, setRound] = useState<PredictionRound | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [agentScores, setAgentScores] = useState<Record<string, any>>({})

  const { connected, lastMessage } = useWebSocket('/ws')
  const latestApi = useApi<PredictionRound>('/api/latest')
  const historyApi = useApi<any>('/api/history')
  const worldApi = useApi<any>('/api/world')

  useEffect(() => {
    latestApi.fetch().then((d) => { if (d?.round_id) setRound(d) })
    historyApi.fetch().then((d) => {
      if (d?.agent_scores) {
        const m: Record<string, any> = {}
        for (const s of d.agent_scores) m[s.agent_name] = s
        setAgentScores(m)
      }
    })
  }, [])

  useEffect(() => {
    if (!lastMessage) return
    if (lastMessage.type === 'prediction_update') {
      setRound(lastMessage.data)
      setPredicting(false)
    }
    if (lastMessage.type === 'verification_update') {
      historyApi.fetch()
    }
  }, [lastMessage])

  useEffect(() => {
    if (activeTab === 'world' && !worldApi.data) {
      worldApi.fetch()
    }
  }, [activeTab])

  const handlePredict = async () => {
    setPredicting(true)
    try {
      const r = await fetch('/api/predict', { method: 'POST' })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (d.round_id) setRound(d)
    } catch { /* ws will deliver it */ }
    finally { setPredicting(false) }
  }

  const handleToggleLang = () => {
    const next = i18n.language === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('pythia-lang', next)
  }

  const consensus = round?.roundtable?.consensus_predictions ?? []
  const wildcards = round?.roundtable?.wildcards ?? []

  return (
    <div className="min-h-screen bg-bg text-zinc-200">
      <Header
        connected={connected}
        predicting={predicting}
        onPredict={handlePredict}
        onToggleLang={handleToggleLang}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sourceCount={round?.source_count ?? 13}
        lastRoundTime={round?.round_id?.slice(2, 15)}
      />

      <Ticker worldData={worldApi.data} />

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <StatsBar
              round={round}
              agentScores={agentScores}
              consensusCount={consensus.length}
            />

            <AgentGrid
              analyses={round?.chief_analyses ?? []}
              scores={agentScores}
            />

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Predictions - 3 cols */}
              <div className="lg:col-span-3 space-y-6">
                <PredictionList
                  predictions={consensus}
                  type="consensus"
                />
                <PredictionList
                  predictions={wildcards}
                  type="wildcard"
                />
                <DebateLog summary={round?.roundtable?.debate_summary} />
              </div>

              {/* Sidebar - 1 col */}
              <div className="space-y-6">
                <SimulationPanel simulation={round?.simulation} />
                <SourceHealth />
              </div>
            </div>
          </div>
        )}

        {/* World Tab */}
        {activeTab === 'world' && (
          <div className="animate-fade-in">
            <WorldPulse data={worldApi.data} />
          </div>
        )}

        {/* Entities Tab */}
        {activeTab === 'entities' && (
          <div className="animate-fade-in">
            <EntityGraph entities={round?.top_entities} />
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center justify-between text-[10px] text-zinc-700">
          <span>Pythia — Open-source swarm intelligence prediction engine</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/" className="hover:text-zinc-400 transition">GitHub</a>
            <span className="text-zinc-800">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
