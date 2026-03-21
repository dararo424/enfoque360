'use client'

import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Plus, Minus, RotateCcw } from 'lucide-react'

// Natural Earth world-atlas topojson (countries at 110m resolution)
// Colombia = numeric ISO 3166-1 id "170"
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Default view centered on Colombia
const DEFAULT_CENTER: [number, number] = [-73.5, 4.5]
const DEFAULT_ZOOM = 1

interface Centro {
  nombre: string
  ciudad: string
  regional: string
  procedimientos: number
  pctAdecuada: number
  activo: boolean
}

const CENTROS: Centro[] = [
  { nombre: 'Clínica Santa Fe',            ciudad: 'Bogotá',       regional: 'Centro',       procedimientos: 284, pctAdecuada: 91, activo: true  },
  { nombre: 'Clínica del Country',          ciudad: 'Bogotá',       regional: 'Centro',       procedimientos: 143, pctAdecuada: 84, activo: true  },
  { nombre: 'Hospital San Vicente Paúl',    ciudad: 'Medellín',     regional: 'Antioquia',    procedimientos: 198, pctAdecuada: 88, activo: true  },
  { nombre: 'Clínica Medellín',             ciudad: 'Medellín',     regional: 'Antioquia',    procedimientos: 117, pctAdecuada: 81, activo: true  },
  { nombre: 'Centro Médico Imbanaco',       ciudad: 'Cali',         regional: 'Suroccidente', procedimientos: 128, pctAdecuada: 82, activo: true  },
  { nombre: 'Fundación Cardiovascular',     ciudad: 'Bucaramanga',  regional: 'Nororiente',   procedimientos: 156, pctAdecuada: 86, activo: true  },
  { nombre: 'Hospital Universitario',       ciudad: 'Manizales',    regional: 'Eje Cafetero', procedimientos:  98, pctAdecuada: 79, activo: true  },
  { nombre: 'Clínica General del Norte',    ciudad: 'Barranquilla', regional: 'Caribe',       procedimientos:  87, pctAdecuada: 83, activo: true  },
  { nombre: 'Clínica Portoazul',            ciudad: 'Barranquilla', regional: 'Caribe',       procedimientos:  64, pctAdecuada: 80, activo: true  },
  { nombre: 'Hospital San José',            ciudad: 'Bogotá',       regional: 'Centro',       procedimientos:  72, pctAdecuada: 77, activo: false },
  { nombre: 'Clínica Las Américas',         ciudad: 'Medellín',     regional: 'Antioquia',    procedimientos:  55, pctAdecuada: 85, activo: false },
  { nombre: 'Centro Médico Dávila',         ciudad: 'Cúcuta',       regional: 'Nororiente',   procedimientos:  41, pctAdecuada: 74, activo: false },
  { nombre: 'Clínica San Juan de Dios',     ciudad: 'Cali',         regional: 'Suroccidente', procedimientos:  38, pctAdecuada: 76, activo: false },
  { nombre: 'Hospital Regional de Pereira', ciudad: 'Pereira',      regional: 'Eje Cafetero', procedimientos:  29, pctAdecuada: 72, activo: false },
]

// Real lat/lon coordinates for each city
const CIUDAD_COORDS: Record<string, [number, number]> = {
  Barranquilla: [-74.796, 10.964],
  Bucaramanga:  [-73.126,  7.119],
  Cúcuta:       [-72.507,  7.893],
  Medellín:     [-75.574,  6.244],
  Manizales:    [-75.520,  5.070],
  Pereira:      [-75.697,  4.814],
  Bogotá:       [-74.082,  4.710],
  Cali:         [-76.521,  3.431],
}

const REGIONAL_COLOR: Record<string, string> = {
  'Centro':       '#0F2D52',
  'Antioquia':    '#0CA5A0',
  'Suroccidente': '#6366f1',
  'Nororiente':   '#f59e0b',
  'Eje Cafetero': '#10b981',
  'Caribe':       '#ec4899',
}

function pctColor(pct: number) {
  if (pct >= 85) return '#0CA5A0'
  if (pct >= 75) return '#f59e0b'
  return '#ef4444'
}

// Label nudges to avoid pin overlap
const LABEL_OFFSET: Record<string, [number, number]> = {
  Barranquilla: [  0, -14],
  Bucaramanga:  [ 12,   2],
  Cúcuta:       [ 12,   2],
  Medellín:     [-12,  -5],
  Manizales:    [-12,   5],
  Pereira:      [-12,   8],
  Bogotá:       [ 12,   2],
  Cali:         [-12,   5],
}

export function TQMapa() {
  const [zoom, setZoom]     = useState(DEFAULT_ZOOM)
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)

  const byCity = CENTROS.reduce<Record<string, Centro[]>>((acc, c) => {
    if (!acc[c.ciudad]) acc[c.ciudad] = []
    acc[c.ciudad].push(c)
    return acc
  }, {})

  const totalActivos  = CENTROS.filter((c) =>  c.activo).length
  const totalProcs    = CENTROS.filter((c) =>  c.activo).reduce((s, c) => s + c.procedimientos, 0)
  const ciudadesCount = [...new Set(CENTROS.filter((c) => c.activo).map((c) => c.ciudad))].length

  // Pin/label sizes shrink as zoom increases so they don't overwhelm the map
  const pinScale   = 1 / zoom
  const labelScale = Math.max(0.5, 1 / zoom)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-teal-light rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-teal">{totalActivos}</p>
          <p className="text-sm text-gray-600 mt-1">Centros activos</p>
        </div>
        <div className="bg-navy/5 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-navy">{ciudadesCount}</p>
          <p className="text-sm text-gray-600 mt-1">Ciudades</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-green-600">{totalProcs.toLocaleString('es-CO')}</p>
          <p className="text-sm text-gray-600 mt-1">Procedimientos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">Distribución geográfica</h3>
              <p className="text-xs text-gray-400">Centros activos · Colombia · arrastra para mover</p>
            </div>
            {/* Zoom controls */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setZoom((z) => Math.min(z * 1.5, 8))}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Acercar"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Alejar"
              >
                <Minus className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button
                onClick={() => { setZoom(DEFAULT_ZOOM); setCenter(DEFAULT_CENTER) }}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Restablecer vista"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-[#e8f4fb] cursor-grab active:cursor-grabbing">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [-73.5, 4.0], scale: 2400 }}
              width={400}
              height={480}
              style={{ width: '100%', height: 'auto' }}
            >
              <ZoomableGroup
                zoom={zoom}
                center={center}
                onMoveEnd={({ zoom: z, coordinates }) => {
                  setZoom(z)
                  setCenter(coordinates as [number, number])
                }}
                minZoom={1}
                maxZoom={8}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies
                      .filter((geo) => geo.id === '170') // Colombia only
                      .map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#dde8ed"
                          stroke="#94a3b8"
                          strokeWidth={0.6}
                          style={{ default: { outline: 'none' } }}
                        />
                      ))
                  }
                </Geographies>

                {Object.entries(byCity)
                  .filter(([ciudad, centros]) => CIUDAD_COORDS[ciudad] && centros.some((c) => c.activo))
                  .map(([ciudad, centros]) => {
                    const coords  = CIUDAD_COORDS[ciudad]
                    const activos = centros.filter((c) => c.activo)
                    const color   = REGIONAL_COLOR[activos[0].regional] ?? '#94a3b8'
                    const r       = (5 + activos.length * 2.5) * pinScale
                    const [lx, ly] = LABEL_OFFSET[ciudad] ?? [0, -14]
                    const anchor   = lx > 0 ? 'start' : lx < 0 ? 'end' : 'middle'

                    return (
                      <Marker key={ciudad} coordinates={coords}>
                        {/* Pulse ring */}
                        <circle r={r + 5 * pinScale} fill={color} opacity={0.18} />
                        {/* Pin */}
                        <circle r={r} fill={color} stroke="white" strokeWidth={1.2 * pinScale} />
                        {/* Count badge */}
                        {activos.length > 1 && (
                          <text dy={3.5 * pinScale} textAnchor="middle" fontSize={8 * pinScale} fill="white" fontWeight="700">
                            {activos.length}
                          </text>
                        )}
                        {/* City label */}
                        <text
                          dx={lx * labelScale} dy={ly * labelScale}
                          textAnchor={anchor}
                          fontSize={8 * labelScale}
                          fill="#1e293b"
                          fontWeight="600"
                          style={{ textShadow: '0 0 3px white, 0 0 3px white' }}
                        >
                          {ciudad}
                        </text>
                      </Marker>
                    )
                  })}
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
            {Object.entries(REGIONAL_COLOR).map(([regional, color]) => (
              <div key={regional} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500">{regional}</span>
              </div>
            ))}
          </div>
        </div>

        {/* City list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-navy">Centros por ciudad</h3>
            <p className="text-xs text-gray-400 mt-0.5">Solo centros activos · ordenados por volumen</p>
          </div>
          <div className="overflow-y-auto max-h-[440px] divide-y divide-gray-50">
            {Object.entries(byCity)
              .filter(([, cs]) => cs.some((c) => c.activo))
              .sort((a, b) =>
                b[1].filter((c) => c.activo).reduce((s, c) => s + c.procedimientos, 0) -
                a[1].filter((c) => c.activo).reduce((s, c) => s + c.procedimientos, 0)
              )
              .map(([ciudad, centros]) => {
                const activos  = centros.filter((c) => c.activo)
                const regional = activos[0]?.regional ?? ''
                const color    = REGIONAL_COLOR[regional] ?? '#94a3b8'
                return (
                  <div key={ciudad} className="px-6 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs font-semibold text-gray-700">{ciudad}</span>
                      <span className="text-xs text-gray-400 ml-auto">{regional}</span>
                    </div>
                    <div className="space-y-1.5">
                      {activos.map((c) => (
                        <div key={c.nombre} className="flex items-center justify-between pl-4">
                          <span className="text-xs text-gray-600 truncate max-w-[160px]">{c.nombre}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">{c.procedimientos} proc.</span>
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ color: pctColor(c.pctAdecuada), backgroundColor: pctColor(c.pctAdecuada) + '1a' }}>
                              {c.pctAdecuada}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Pending activation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-navy">En proceso de activación</h3>
          <p className="text-xs text-gray-400 mt-0.5">Centros con acuerdo firmado, pendientes de inicio</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Centro', 'Ciudad', 'Regional', 'Estado'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CENTROS.filter((c) => !c.activo).map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-3 text-gray-700 text-sm">{c.nombre}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{c.ciudad}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ color: REGIONAL_COLOR[c.regional] ?? '#94a3b8', backgroundColor: (REGIONAL_COLOR[c.regional] ?? '#94a3b8') + '1a' }}>
                      {c.regional}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      En activación
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
