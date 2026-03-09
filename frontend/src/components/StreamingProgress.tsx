import { useTranslation } from 'react-i18next'
import { CheckCircle2, Loader2, Circle, Zap, MessageSquare, Users, Database, Brain, Network } from 'lucide-react'

interface StepInfo {
  step: number
  total: number
  label: string
  message: string
  message_en: string
}

interface AgentResult {
  agent: string
  agent_cn: string
  emoji: string
  domain: string
  completed: number
  total_agents: number
  output: any
  prediction_count: number
}

interface Props {
  currentStep: StepInfo | null
  completedAgents: AgentResult[]
  roundtableResult: any | null
  entityInfo: any | null
  isComplete: boolean
}

const STEP_ICONS = [Database, Network, Brain, MessageSquare, Users, Database]
const STEP_LABELS_ZH = ['收集数据', '提取实体', '智能体推理', '圆桌辩论', '公民仿真', '存储结果']
const STEP_LABELS_EN = ['Collect Data', 'Extract Entities', 'Agent Analysis', 'Roundtable', 'Simulation', 'Store']

const DOMAIN_COLOR: Record<string, string> = {
  politics: '#8b5cf6', tech: '#06b6d4', opinion: '#f59e0b', finance: '#10b981',
  culture: '#ec4899', blackswan: '#ef4444', military: '#94a3b8', health: '#22c55e',
  energy: '#14b8a6', china: '#ef4444', crypto: '#f97316', supply_chain: '#3b82f6',
}

export default function StreamingProgress({ currentStep, completedAgents, roundtableResult, entityInfo, isComplete }: Props) {
  const { i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const activeStep = currentStep?.step ?? 0

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="rounded-xl overflow-hidden" style={{ background: '#141414', border: '1px solid #27272a' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: '#1f1f23' }}>
          <div className="flex items-center gap-3">
            {!isComplete ? (
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                <Loader2 size={16} className="text-violet-400 animate-spin" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-green-400" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-zinc-200">
                {isComplete ? (isZh ? '预测完成' : 'Prediction Complete') : (isZh ? '预测进行中...' : 'Prediction in progress...')}
              </h3>
              {currentStep && !isComplete && (
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {isZh ? currentStep.message : currentStep.message_en}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step progress bar */}
        <div className="px-5 py-3 border-b" style={{ borderColor: '#1f1f23' }}>
          <div className="flex items-center gap-1">
            {Array.from({ length: 6 }, (_, i) => {
              const stepNum = i + 1
              const Icon = STEP_ICONS[i]
              const isDone = stepNum < activeStep || isComplete
              const isActive = stepNum === activeStep && !isComplete
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isDone ? 'bg-green-600/20' : isActive ? 'bg-violet-600/20' : 'bg-zinc-900'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 size={13} className="text-green-400" />
                    ) : isActive ? (
                      <Icon size={12} className="text-violet-400 animate-pulse" />
                    ) : (
                      <Circle size={10} className="text-zinc-700" />
                    )}
                  </div>
                  <span className={`text-[7px] font-mono text-center leading-tight ${
                    isDone ? 'text-green-500' : isActive ? 'text-violet-400' : 'text-zinc-700'
                  }`}>
                    {isZh ? STEP_LABELS_ZH[i] : STEP_LABELS_EN[i]}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 rounded-full bg-zinc-900 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-violet-600 to-cyan-500"
              style={{ width: `${isComplete ? 100 : ((activeStep - 1) / 6) * 100}%` }} />
          </div>
        </div>

        {/* Entity info */}
        {entityInfo && (
          <div className="px-5 py-2 border-b flex items-center gap-3" style={{ borderColor: '#1f1f23' }}>
            <Network size={11} className="text-cyan-500 shrink-0" />
            <span className="text-[10px] text-zinc-500">
              {isZh ? `提取到 ${entityInfo.count} 个实体` : `Extracted ${entityInfo.count} entities`}
            </span>
            <div className="flex gap-1 flex-wrap">
              {(entityInfo.top ?? []).slice(0, 5).map(([name, count]: [string, number], i: number) => (
                <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                  {name} ×{count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Agent results stream */}
        {completedAgents.length > 0 && (
          <div className="px-5 py-3 border-b" style={{ borderColor: '#1f1f23' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">
                {isZh ? '智能体分析' : 'Agent Analysis'}
              </span>
              <span className="text-[9px] text-zinc-600 font-mono">
                {completedAgents.length}/{completedAgents[0]?.total_agents ?? 12}
              </span>
            </div>
            <div className="space-y-1.5">
              {completedAgents.map((a, i) => {
                const color = DOMAIN_COLOR[a.domain] ?? '#71717a'
                const preds = a.output?.predictions ?? []
                return (
                  <div key={a.agent} className="flex items-start gap-2.5 py-1.5 rounded-lg px-2 animate-slide-in"
                    style={{ animationDelay: `${i * 50}ms`, background: `${color}06` }}>
                    <span className="text-base shrink-0">{a.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-zinc-300">{a.agent_cn}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${color}15`, color }}>
                          {a.domain}
                        </span>
                        <span className="text-[8px] text-zinc-600 font-mono">{a.prediction_count} predictions</span>
                      </div>
                      {a.output?.analysis && (
                        <p className="text-[9px] text-zinc-500 mt-0.5 line-clamp-1">{a.output.analysis}</p>
                      )}
                      {preds.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {preds.slice(0, 2).map((p: any, j: number) => (
                            <div key={j} className="flex items-start gap-1.5">
                              <Zap size={8} className="mt-0.5 shrink-0" style={{ color }} />
                              <span className="text-[9px] text-zinc-400 line-clamp-1">{p.prediction}</span>
                              <span className="text-[8px] font-mono shrink-0" style={{ color }}>
                                {Math.round((p.confidence ?? 0) * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <CheckCircle2 size={12} className="text-green-500 shrink-0 mt-1" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Roundtable result */}
        {roundtableResult && (
          <div className="px-5 py-2 border-b" style={{ borderColor: '#1f1f23' }}>
            <div className="flex items-center gap-2">
              <MessageSquare size={11} className="text-amber-500" />
              <span className="text-[10px] text-zinc-400">
                {isZh
                  ? `辩论完成: ${roundtableResult.consensus_count} 共识预测, ${roundtableResult.wildcard_count} 黑天鹅`
                  : `Debate done: ${roundtableResult.consensus_count} consensus, ${roundtableResult.wildcard_count} wildcards`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
