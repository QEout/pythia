import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import 'leaflet/dist/leaflet.css'

interface Props {
  data: any
}

const LAYER_CONFIG = {
  conflicts: { color: '#ef4444', label: '⚔️ Conflicts', labelZh: '⚔️ 冲突' },
  earthquakes: { color: '#f97316', label: '🌋 Earthquakes', labelZh: '🌋 地震' },
  fires: { color: '#eab308', label: '🔥 Fires', labelZh: '🔥 火点' },
  disruptions: { color: '#3b82f6', label: '⚠️ Disasters', labelZh: '⚠️ 灾害' },
} as const

type LayerKey = keyof typeof LAYER_CONFIG

function FitBounds({ markers }: { markers: [number, number][] }) {
  const map = useMap()
  if (markers.length > 1) {
    const lats = markers.map(m => m[0])
    const lngs = markers.map(m => m[1])
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 })
  }
  return null
}

function parseCoord(item: any): { lat: number; lng: number } | null {
  const lat = item.latitude ?? item.lat ?? item.coordinates?.lat
  const lng = item.longitude ?? item.lng ?? item.lon ?? item.coordinates?.lng ?? item.coordinates?.lon
  if (typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0) {
    return { lat, lng }
  }
  return null
}

export default function IntelMap({ data }: Props) {
  const { i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    conflicts: true,
    earthquakes: true,
    fires: true,
    disruptions: true,
  })

  const toggle = (key: LayerKey) => setLayers(prev => ({ ...prev, [key]: !prev[key] }))

  const conflicts = useMemo(() => (data?.conflicts ?? []).map((c: any) => ({ ...c, coord: parseCoord(c) })).filter((c: any) => c.coord), [data?.conflicts])
  const earthquakes = useMemo(() => (data?.earthquakes ?? []).map((q: any) => ({ ...q, coord: parseCoord(q) })).filter((q: any) => q.coord), [data?.earthquakes])
  const fires = useMemo(() => (data?.fires ?? []).map((f: any) => ({ ...f, coord: parseCoord(f) })).filter((f: any) => f.coord), [data?.fires])
  const disruptions = useMemo(() => (data?.disruptions ?? []).map((d: any) => ({ ...d, coord: parseCoord(d) })).filter((d: any) => d.coord), [data?.disruptions])

  const totalMarkers = (layers.conflicts ? conflicts.length : 0) + (layers.earthquakes ? earthquakes.length : 0) + (layers.fires ? fires.length : 0) + (layers.disruptions ? disruptions.length : 0)

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm">🗺️</span>
          <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wide">Intel Map</span>
          <span className="text-[9px] font-mono text-zinc-600">{totalMarkers} markers</span>
        </div>
        <div className="flex items-center gap-3">
          {(Object.keys(LAYER_CONFIG) as LayerKey[]).map(key => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono transition"
              style={{
                background: layers[key] ? `${LAYER_CONFIG[key].color}20` : 'transparent',
                border: `1px solid ${layers[key] ? LAYER_CONFIG[key].color + '60' : '#333'}`,
                color: layers[key] ? LAYER_CONFIG[key].color : '#666',
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: layers[key] ? LAYER_CONFIG[key].color : '#444' }} />
              {isZh ? LAYER_CONFIG[key].labelZh.split(' ')[1] : LAYER_CONFIG[key].label.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: 400, width: '100%', background: '#e8eaed' }}
        zoomControl={true}
        attributionControl={false}
        minZoom={2}
        maxZoom={10}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />

        {layers.conflicts && conflicts.map((c: any, i: number) => (
          <CircleMarker
            key={`c-${i}`}
            center={[c.coord.lat, c.coord.lng]}
            radius={Math.min(4 + (c.fatalities ?? 0) / 5, 18)}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5, weight: 1 }}
          >
            <Popup>
              <div className="text-xs max-w-[200px]">
                <strong>{c.title || 'Conflict Event'}</strong>
                {c.fatalities && <div>Casualties: {c.fatalities}</div>}
                {c.country && <div>{c.country}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.earthquakes && earthquakes.map((q: any, i: number) => (
          <CircleMarker
            key={`q-${i}`}
            center={[q.coord.lat, q.coord.lng]}
            radius={Math.min(3 + (q.magnitude ?? 0) * 2, 20)}
            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.5, weight: 1 }}
          >
            <Popup>
              <div className="text-xs max-w-[200px]">
                <strong>M{(q.magnitude ?? 0).toFixed(1)}</strong>
                <div>{q.title ?? q.location ?? ''}</div>
                {q.time && <div className="text-gray-500">{q.time}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.fires && fires.map((f: any, i: number) => (
          <CircleMarker
            key={`f-${i}`}
            center={[f.coord.lat, f.coord.lng]}
            radius={4}
            pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 0.6, weight: 1 }}
          >
            <Popup>
              <div className="text-xs max-w-[200px]">
                <strong>{f.title || 'Active Fire'}</strong>
                {f.brightness && <div>Brightness: {f.brightness}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {layers.disruptions && disruptions.map((d: any, i: number) => (
          <CircleMarker
            key={`d-${i}`}
            center={[d.coord.lat, d.coord.lng]}
            radius={6}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.4, weight: 1 }}
          >
            <Popup>
              <div className="text-xs max-w-[200px]">
                <strong>{d.title || 'Disaster Alert'}</strong>
                {d.country && <div>{d.country}</div>}
                {d.severity && <div>Severity: {d.severity}</div>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
