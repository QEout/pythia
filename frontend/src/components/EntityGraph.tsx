import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Network, X, Maximize2, Minimize2, Tag, Clock, Target, Link2, FileText, History, CheckCircle2, XCircle, AlertCircle, Zap, ChevronRight } from 'lucide-react'
import * as d3 from 'd3'

interface Props {
  entities?: [string, number][]
}

const PALETTE = [
  '#FF6B35', '#004E89', '#7B2D8E', '#1A936F', '#C5283D',
  '#E9724C', '#3498db', '#9b59b6', '#27ae60', '#f39c12',
]

const TYPE_ICON: Record<string, string> = {
  country: '🌍', person: '👤', company: '🏢', organization: '🏛️',
  crypto: '₿',  topic: '📌',  index: '📈',  event_type: '⚡',
}

interface GNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: string
  count: number
  color: string
  context?: string
  lastSeen?: string
  firstSeen?: string
}

interface GEdge extends d3.SimulationLinkDatum<GNode> {
  label: string
  curvature: number
}

interface EntityDetail {
  entity: string
  entity_type: string
  mention_count: number
  first_seen: string
  last_seen: string
  contexts: { meta: string; text: string }[]
  relations: string[]
  related_entities: { entity: string; entity_type: string; mention_count: number; context?: string }[]
  related_predictions: { prediction: string; confidence: number; agent_name: string; domain: string; verified: number | null; verify_note: string | null; ts: string }[]
  agent_mentions: { agent_name: string; prediction: string; confidence: number; outcome: string | null; ts: string }[]
}

function EntityDetailPanel({ nodeName, nodeColor, nodeType, onClose }: {
  nodeName: string; nodeColor: string; nodeType: string; onClose: () => void
}) {
  const [detail, setDetail] = useState<EntityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'context' | 'predictions' | 'connections'>('context')

  useEffect(() => {
    setLoading(true)
    setTab('context')
    fetch(`/api/entity/${encodeURIComponent(nodeName)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDetail(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [nodeName])

  const icon = TYPE_ICON[nodeType] ?? '•'

  return (
    <div className="absolute top-3 right-3 w-80 max-h-[calc(100%-24px)] flex flex-col rounded-lg overflow-hidden shadow-2xl"
      style={{ background: 'rgba(15,15,17,0.97)', border: `1px solid ${nodeColor}30`, backdropFilter: 'blur(16px)' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: '#27272a' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg shrink-0">{icon}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-100 truncate">{nodeName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: nodeColor }} />
                <span className="text-[9px] font-mono capitalize" style={{ color: nodeColor }}>{nodeType}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition p-1 rounded hover:bg-white/5 shrink-0">
            <X size={14} />
          </button>
        </div>

        {/* Stats row */}
        {detail && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center py-1.5 rounded" style={{ background: `${nodeColor}10` }}>
              <div className="text-sm font-bold font-mono" style={{ color: nodeColor }}>{detail.mention_count}</div>
              <div className="text-[7px] text-zinc-600 uppercase">提及次数</div>
            </div>
            <div className="text-center py-1.5 rounded" style={{ background: `${nodeColor}10` }}>
              <div className="text-sm font-bold font-mono" style={{ color: nodeColor }}>{detail.related_predictions.length}</div>
              <div className="text-[7px] text-zinc-600 uppercase">相关预测</div>
            </div>
            <div className="text-center py-1.5 rounded" style={{ background: `${nodeColor}10` }}>
              <div className="text-sm font-bold font-mono" style={{ color: nodeColor }}>{detail.related_entities.length}</div>
              <div className="text-[7px] text-zinc-600 uppercase">关联实体</div>
            </div>
          </div>
        )}

        {/* Time range */}
        {detail && (
          <div className="flex items-center gap-3 mt-2 text-[8px] text-zinc-600 font-mono">
            <span className="flex items-center gap-1"><Clock size={8} /> 首次: {detail.first_seen?.slice(0, 16)}</span>
            <span>最近: {detail.last_seen?.slice(0, 16)}</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b shrink-0" style={{ borderColor: '#1a1a1e' }}>
        {([
          { key: 'context' as const, icon: FileText, label: '上下文' },
          { key: 'predictions' as const, icon: Target, label: '相关预测' },
          { key: 'connections' as const, icon: Link2, label: '关联图谱' },
        ]).map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-semibold uppercase tracking-wider transition ${
              tab === t.key ? 'border-b-2' : 'text-zinc-600 hover:text-zinc-400'
            }`}
            style={tab === t.key ? { color: nodeColor, borderColor: nodeColor } : {}}>
            <t.icon size={10} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2.5" style={{ scrollbarGutter: 'stable' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${nodeColor}30`, borderTopColor: nodeColor }} />
          </div>
        ) : !detail ? (
          <div className="text-center py-10 text-[10px] text-zinc-600">暂无详细数据 — 需要先运行预测</div>
        ) : (
          <>
            {/* Context tab */}
            {tab === 'context' && (
              <div className="space-y-1.5 animate-fade-in">
                {detail.contexts.length > 0 ? detail.contexts.map((ctx, i) => (
                  <div key={i} className="py-1.5 border-b border-zinc-900/50">
                    {ctx.meta && (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded mb-1 inline-block"
                        style={{
                          background: ctx.meta.includes('verified:hit') ? 'rgba(34,197,94,0.1)' :
                            ctx.meta.includes('verified:miss') ? 'rgba(239,68,68,0.1)' :
                            ctx.meta.includes('prediction') ? `${nodeColor}12` : 'rgba(63,63,70,0.3)',
                          color: ctx.meta.includes('verified:hit') ? '#22c55e' :
                            ctx.meta.includes('verified:miss') ? '#ef4444' : '#71717a',
                        }}>
                        {ctx.meta}
                      </span>
                    )}
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{ctx.text}</p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-[10px] text-zinc-700">暂无上下文记录</div>
                )}

                {/* Agent mentions */}
                {detail.agent_mentions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-800">
                    <div className="text-[8px] text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Zap size={8} /> 智能体提及
                    </div>
                    {detail.agent_mentions.map((m, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-b border-zinc-900/30">
                        <div className="mt-0.5">
                          {m.outcome === 'hit' ? <CheckCircle2 size={10} className="text-green-500" /> :
                           m.outcome === 'miss' ? <XCircle size={10} className="text-red-500" /> :
                           <Clock size={10} className="text-zinc-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-semibold" style={{ color: nodeColor }}>{m.agent_name}</span>
                            <span className="text-[8px] text-zinc-700 font-mono">{Math.round(m.confidence * 100)}%</span>
                          </div>
                          <p className="text-[9px] text-zinc-500 line-clamp-2 mt-0.5">{m.prediction}</p>
                          <span className="text-[7px] text-zinc-700 font-mono">{m.ts}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Predictions tab */}
            {tab === 'predictions' && (
              <div className="space-y-1 animate-fade-in">
                {detail.related_predictions.length > 0 ? detail.related_predictions.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 py-2 border-b border-zinc-900/50">
                    <div className="mt-0.5 shrink-0">
                      {p.verified === 1 ? <CheckCircle2 size={11} className="text-green-500" /> :
                       p.verified === 0 ? <XCircle size={11} className="text-red-500" /> :
                       <AlertCircle size={11} className="text-zinc-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-300 leading-relaxed">{p.prediction}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[8px] font-mono font-bold" style={{ color: nodeColor }}>
                          {Math.round(p.confidence * 100)}%
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: `${nodeColor}12`, color: nodeColor }}>
                          {p.agent_name}
                        </span>
                        <span className="text-[8px] text-zinc-700 px-1.5 py-0.5 rounded bg-zinc-900 font-mono">{p.domain}</span>
                        <span className="text-[7px] text-zinc-700 font-mono">{p.ts?.slice(0, 16)}</span>
                      </div>
                      {p.verify_note && (
                        <p className="text-[8px] text-zinc-600 mt-1 italic">
                          {p.verified === 1 ? '✓' : '✗'} {p.verify_note}
                        </p>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <Target size={20} className="mx-auto text-zinc-800 mb-2" />
                    <p className="text-[10px] text-zinc-600">暂无相关预测</p>
                  </div>
                )}
              </div>
            )}

            {/* Connections tab */}
            {tab === 'connections' && (
              <div className="space-y-1.5 animate-fade-in">
                {/* Direct relations */}
                {detail.relations.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1.5">直接关联</div>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.relations.map((r, i) => (
                        <span key={i} className="text-[9px] px-2 py-1 rounded-full font-mono border border-zinc-800 text-zinc-400 hover:border-zinc-600 transition cursor-default">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Co-occurring entities */}
                {detail.related_entities.length > 0 ? (
                  <div>
                    <div className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1.5">共现 / 同类实体</div>
                    {detail.related_entities.slice(0, 12).map((e, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-zinc-900/30 group hover:bg-white/[0.01] transition">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{
                          backgroundColor: PALETTE[Object.keys(TYPE_ICON).indexOf(e.entity_type) % PALETTE.length] || '#71717a'
                        }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-300 font-medium truncate">{e.entity}</span>
                            <span className="text-[7px] px-1 py-0.5 rounded bg-zinc-900 text-zinc-600 font-mono capitalize shrink-0">
                              {TYPE_ICON[e.entity_type] ?? '•'} {e.entity_type}
                            </span>
                          </div>
                          {e.context && (
                            <p className="text-[8px] text-zinc-700 truncate mt-0.5">{e.context}</p>
                          )}
                        </div>
                        <span className="text-[9px] font-mono font-bold text-zinc-600 shrink-0">×{e.mention_count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Link2 size={20} className="mx-auto text-zinc-800 mb-2" />
                    <p className="text-[10px] text-zinc-600">暂无关联实体</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function EntityGraph({ entities: propEntities }: Props) {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [apiEntities, setApiEntities] = useState<any[]>([])
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const [showLabels, setShowLabels] = useState(true)

  useEffect(() => {
    fetch('/api/entities').then(r => r.json()).then(setApiEntities).catch(() => {})
  }, [])

  const buildGraph = useCallback(() => {
    const raw = apiEntities.length > 0
      ? apiEntities.map((e: any) => ({
          name: e.entity,
          type: e.entity_type ?? 'topic',
          count: e.mention_count ?? 1,
          contexts: e.context ? [e.context] : [],
          lastSeen: e.last_seen,
          firstSeen: e.first_seen,
        }))
      : (propEntities ?? []).map(([name, count]) => ({ name, type: 'topic', count, contexts: [], lastSeen: '', firstSeen: '' }))

    if (raw.length === 0) return { nodes: [], edges: [] }

    const typeColorMap = new Map<string, string>()
    let colorIdx = 0
    const getColor = (type: string) => {
      if (!typeColorMap.has(type)) {
        typeColorMap.set(type, PALETTE[colorIdx % PALETTE.length])
        colorIdx++
      }
      return typeColorMap.get(type)!
    }

    const nodes: GNode[] = raw.map((e, i) => ({
      id: `n${i}`,
      name: e.name,
      type: e.type,
      count: e.count,
      color: getColor(e.type),
      context: e.contexts[0],
      lastSeen: e.lastSeen,
      firstSeen: e.firstSeen,
    }))

    const edges: GEdge[] = []
    const pairCounts = new Map<string, number>()

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = raw[i], b = raw[j]
        const shared = a.contexts.some((c: string) =>
          b.contexts.some((bc: string) => c && bc && (c.includes(b.name) || bc.includes(a.name)))
        )
        const sameType = a.type === b.type && a.type !== 'topic'
        if (shared || (sameType && Math.random() < 0.35) || (!shared && !sameType && Math.random() < 0.12)) {
          const pairKey = `${i}-${j}`
          const count = (pairCounts.get(pairKey) ?? 0) + 1
          pairCounts.set(pairKey, count)
          const curvature = count > 1 ? ((count / 2) - 0.5) * 0.6 : 0
          edges.push({
            source: nodes[i],
            target: nodes[j],
            label: shared ? 'co-mentioned' : sameType ? 'same-type' : 'related',
            curvature,
          })
        }
      }
    }

    return { nodes, edges }
  }, [apiEntities, propEntities])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const { nodes, edges } = buildGraph()
    if (nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight || 500

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const defs = svg.append('defs')
    const patternId = 'dot-grid'
    defs.append('pattern')
      .attr('id', patternId)
      .attr('width', 24).attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('circle')
      .attr('cx', 12).attr('cy', 12).attr('r', 1)
      .attr('fill', '#3f3f46')

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L8,0L0,3')
      .attr('fill', '#52525b')

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#18181b')
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', `url(#${patternId})`)

    const g = svg.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)

    const simulation = d3.forceSimulation<GNode>(nodes)
      .force('link', d3.forceLink<GNode, GEdge>(edges).id(d => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-380))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(45))
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04))

    const linkGroup = g.append('g')
    const link = linkGroup.selectAll<SVGPathElement, GEdge>('path')
      .data(edges).enter().append('path')
      .attr('fill', 'none').attr('stroke', '#52525b')
      .attr('stroke-width', 1.2).attr('stroke-opacity', 0.5)
      .attr('marker-end', 'url(#arrowhead)')

    const edgeLabelGroup = g.append('g')
    const edgeLabels = edgeLabelGroup.selectAll<SVGTextElement, GEdge>('text')
      .data(edges).enter().append('text')
      .text(d => d.label)
      .attr('font-size', '8px').attr('fill', '#71717a')
      .attr('text-anchor', 'middle').attr('dy', -4)
      .style('pointer-events', 'none')
      .style('display', showLabels ? 'block' : 'none')

    const nodeGroup = g.append('g')
    const maxCount = Math.max(1, ...nodes.map(n => n.count))
    const radiusScale = d3.scaleSqrt().domain([1, maxCount]).range([7, 16])

    const node = nodeGroup.selectAll<SVGCircleElement, GNode>('circle')
      .data(nodes).enter().append('circle')
      .attr('r', d => radiusScale(d.count))
      .attr('fill', d => d.color)
      .attr('stroke', '#fafafa').attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('mouseenter', function (_event, d) {
        d3.select(this).attr('stroke', '#e4e4e7').attr('stroke-width', 3)
        link.attr('stroke', (e: any) =>
          e.source.id === d.id || e.target.id === d.id ? d.color : '#52525b'
        ).attr('stroke-opacity', (e: any) =>
          e.source.id === d.id || e.target.id === d.id ? 0.9 : 0.2
        ).attr('stroke-width', (e: any) =>
          e.source.id === d.id || e.target.id === d.id ? 2 : 1.2
        )
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', '#fafafa').attr('stroke-width', 2)
        link.attr('stroke', '#52525b').attr('stroke-opacity', 0.5).attr('stroke-width', 1.2)
      })
      .on('click', (_event, d) => {
        setSelectedNode(prev => prev?.id === d.id ? null : d)
        nodeGroup.selectAll('circle').attr('stroke', '#fafafa').attr('stroke-width', 2)
        d3.select(_event.currentTarget).attr('stroke', '#E91E63').attr('stroke-width', 3.5)
      })
      .call(d3.drag<SVGCircleElement, GNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    nodeGroup.selectAll<SVGTextElement, GNode>('text')
      .data(nodes).enter().append('text')
      .text(d => d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name)
      .attr('font-size', '10px').attr('fill', '#d4d4d8')
      .attr('font-family', "'JetBrains Mono', 'SF Mono', monospace")
      .attr('font-weight', '500')
      .attr('dx', d => radiusScale(d.count) + 4).attr('dy', 4)
      .style('pointer-events', 'none')

    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y
        if (d.curvature === 0) return `M${sx},${sy}L${tx},${ty}`
        const dx = tx - sx, dy = ty - sy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const offset = dist * 0.25 * d.curvature
        const cx = (sx + tx) / 2 + (-dy / dist) * offset
        const cy = (sy + ty) / 2 + (dx / dist) * offset
        return `M${sx},${sy}Q${cx},${cy} ${tx},${ty}`
      })
      edgeLabels.attr('x', (d: any) => (d.source.x + d.target.x) / 2).attr('y', (d: any) => (d.source.y + d.target.y) / 2)
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y)
      nodeGroup.selectAll<SVGTextElement, GNode>('text').attr('x', (d: any) => d.x).attr('y', (d: any) => d.y)
    })

    svg.on('click', (event) => {
      if (event.target === svgRef.current || event.target.tagName === 'rect') {
        setSelectedNode(null)
        nodeGroup.selectAll('circle').attr('stroke', '#fafafa').attr('stroke-width', 2)
      }
    })

    return () => { simulation.stop() }
  }, [buildGraph, showLabels, isMaximized])

  const { nodes: graphNodes } = buildGraph()
  const typeColors = new Map<string, string>()
  let ci = 0
  graphNodes.forEach(n => {
    if (!typeColors.has(n.type)) {
      typeColors.set(n.type, PALETTE[ci % PALETTE.length])
      ci++
    }
  })

  return (
    <section className={`animate-slide-up ${isMaximized ? 'fixed inset-0 z-50' : 'relative'}`}
      style={isMaximized ? { background: '#09090b' } : {}}>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-2">
          <Network size={12} />
          {t('sections.entities')}
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)}
              className="w-3 h-3 accent-violet-500 rounded" />
            <span className="text-[9px] text-zinc-500 font-mono">Labels</span>
          </label>
          <span className="text-[10px] text-zinc-600 font-mono">{graphNodes.length} entities</span>
          <button onClick={() => setIsMaximized(!isMaximized)}
            className="text-zinc-600 hover:text-zinc-300 transition">
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative rounded-lg overflow-hidden border"
        style={{ height: isMaximized ? 'calc(100vh - 60px)' : 520, background: '#18181b', borderColor: '#27272a' }}>

        {graphNodes.length > 0 ? (
          <svg ref={svgRef} className="w-full h-full" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Network size={40} className="text-zinc-800 mb-3" />
            <p className="text-xs text-zinc-600 font-mono">{t('sections.noData')}</p>
          </div>
        )}

        {/* Legend */}
        {typeColors.size > 0 && (
          <div className="absolute bottom-3 left-3 rounded-lg px-3 py-2 space-y-1"
            style={{ background: 'rgba(24,24,27,0.92)', border: '1px solid #27272a', backdropFilter: 'blur(8px)' }}>
            <div className="text-[8px] text-zinc-500 font-mono uppercase mb-1">Entity Types</div>
            {Array.from(typeColors.entries()).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-zinc-400 font-mono capitalize">{TYPE_ICON[type] ?? '•'} {type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Detail panel */}
        {selectedNode && (
          <EntityDetailPanel
            nodeName={selectedNode.name}
            nodeColor={selectedNode.color}
            nodeType={selectedNode.type}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </section>
  )
}
