'use client'

// Schematic geographic view of active centers in Colombia
// Positions approximate to real city coordinates (no external map API needed)

interface Centro {
  nombre: string
  ciudad: string
  regional: string
  procedimientos: number
  pctAdecuada: number
  activo: boolean
}

const CENTROS: Centro[] = [
  { nombre: 'Clínica Santa Fe',              ciudad: 'Bogotá',       regional: 'Centro',       procedimientos: 284, pctAdecuada: 91, activo: true  },
  { nombre: 'Clínica del Country',            ciudad: 'Bogotá',       regional: 'Centro',       procedimientos: 143, pctAdecuada: 84, activo: true  },
  { nombre: 'Hospital San Vicente Paúl',      ciudad: 'Medellín',     regional: 'Antioquia',    procedimientos: 198, pctAdecuada: 88, activo: true  },
  { nombre: 'Clínica Medellín',               ciudad: 'Medellín',     regional: 'Antioquia',    procedimientos: 117, pctAdecuada: 81, activo: true  },
  { nombre: 'Centro Médico Imbanaco',         ciudad: 'Cali',         regional: 'Suroccidente', procedimientos: 128, pctAdecuada: 82, activo: true  },
  { nombre: 'Fundación Cardiovascular',       ciudad: 'Bucaramanga',  regional: 'Nororiente',   procedimientos: 156, pctAdecuada: 86, activo: true  },
  { nombre: 'Hospital Universitario',         ciudad: 'Manizales',    regional: 'Eje Cafetero', procedimientos:  98, pctAdecuada: 79, activo: true  },
  { nombre: 'Clínica General del Norte',      ciudad: 'Barranquilla', regional: 'Caribe',       procedimientos:  87, pctAdecuada: 83, activo: true  },
  { nombre: 'Clínica Portoazul',              ciudad: 'Barranquilla', regional: 'Caribe',       procedimientos:  64, pctAdecuada: 80, activo: true  },
  { nombre: 'Hospital San José',              ciudad: 'Bogotá',       regional: 'Centro',       procedimientos:  72, pctAdecuada: 77, activo: false },
  { nombre: 'Clínica Las Américas',           ciudad: 'Medellín',     regional: 'Antioquia',    procedimientos:  55, pctAdecuada: 85, activo: false },
  { nombre: 'Centro Médico Dávila',           ciudad: 'Cúcuta',       regional: 'Nororiente',   procedimientos:  41, pctAdecuada: 74, activo: false },
  { nombre: 'Clínica San Juan de Dios',       ciudad: 'Cali',         regional: 'Suroccidente', procedimientos:  38, pctAdecuada: 76, activo: false },
  { nombre: 'Hospital Regional de Pereira',   ciudad: 'Pereira',      regional: 'Eje Cafetero', procedimientos:  29, pctAdecuada: 72, activo: false },
]

// Approximate positions inside a 300×380 viewBox (Colombia bounding box)
// Lat range: -4.2 → 12.6 (16.8°) | Lon range: -79 → -66.9 (12.1°)
// x = (lon - (-79)) / 12.1 * 300, y = (12.6 - lat) / 16.8 * 380
const CIUDAD_POS: Record<string, { x: number; y: number }> = {
  Barranquilla: { x: 103, y:  38 },
  Bucaramanga:  { x: 147, y: 122 },
  Cúcuta:       { x: 165, y: 100 },
  Medellín:     { x:  89, y: 148 },
  Manizales:    { x:  98, y: 172 },
  Pereira:      { x:  90, y: 182 },
  Bogotá:       { x: 128, y: 194 },
  Cali:         { x:  77, y: 220 },
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

// Simplified Colombia SVG outline path (rough approximation)
const COLOMBIA_PATH = `
  M 103 20 L 118 15 L 138 18 L 158 28 L 172 45 L 180 62 L 175 78 L 165 88
  L 172 105 L 168 122 L 155 135 L 148 152 L 158 168 L 155 185 L 145 198
  L 138 215 L 130 235 L 118 252 L 105 262 L 90 268 L 75 260 L 62 248
  L 55 232 L 50 215 L 48 198 L 52 182 L 58 165 L 60 148 L 68 132
  L 72 115 L 68 100 L 72 85 L 80 72 L 78 58 L 82 45 L 92 35 Z
`

export function TQMapa() {
  const byCity = CENTROS.reduce<Record<string, Centro[]>>((acc, c) => {
    if (!acc[c.ciudad]) acc[c.ciudad] = []
    acc[c.ciudad].push(c)
    return acc
  }, {})

  const totalActivos = CENTROS.filter((c) => c.activo).length
  const totalProcs   = CENTROS.filter((c) => c.activo).reduce((s, c) => s + c.procedimientos, 0)
  const ciudadesActivas = [...new Set(CENTROS.filter((c) => c.activo).map((c) => c.ciudad))].length

  return (
    <div className="space-y-6">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-teal-light rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-teal">{totalActivos}</p>
          <p className="text-sm text-gray-600 mt-1">Centros activos</p>
        </div>
        <div className="bg-navy/5 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-navy">{ciudadesActivas}</p>
          <p className="text-sm text-gray-600 mt-1">Ciudades</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-green-600">{totalProcs.toLocaleString('es-CO')}</p>
          <p className="text-sm text-gray-600 mt-1">Procedimientos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mapa esquemático */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-1">Distribución geográfica</h3>
          <p className="text-xs text-gray-400 mb-4">Centros activos · Colombia</p>

          <div className="flex justify-center">
            <svg viewBox="0 0 300 300" width="280" height="280" className="overflow-visible">
              {/* Colombia outline — filled with soft background */}
              <path d={COLOMBIA_PATH} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />

              {/* City markers */}
              {Object.entries(byCity).map(([ciudad, centros]) => {
                const pos = CIUDAD_POS[ciudad]
                if (!pos) return null
                const activos = centros.filter((c) => c.activo)
                if (activos.length === 0) return null
                const regional = activos[0].regional
                const color = REGIONAL_COLOR[regional] ?? '#94a3b8'
                const radius = 6 + activos.length * 2

                return (
                  <g key={ciudad}>
                    {/* Pulse ring */}
                    <circle cx={pos.x} cy={pos.y} r={radius + 4} fill={color} opacity={0.15} />
                    {/* Main dot */}
                    <circle cx={pos.x} cy={pos.y} r={radius} fill={color} />
                    {/* Count */}
                    <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                      {activos.length}
                    </text>
                    {/* City label */}
                    <text x={pos.x} y={pos.y + radius + 12} textAnchor="middle" fontSize="8.5" fill="#64748b" fontWeight="500">
                      {ciudad}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Leyenda regionales */}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {Object.entries(REGIONAL_COLOR).map(([regional, color]) => (
              <div key={regional} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500">{regional}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de centros por ciudad */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-navy">Centros por ciudad</h3>
            <p className="text-xs text-gray-400 mt-0.5">Solo centros activos</p>
          </div>
          <div className="overflow-y-auto max-h-[340px] divide-y divide-gray-50">
            {Object.entries(byCity)
              .filter(([, cs]) => cs.some((c) => c.activo))
              .sort((a, b) => b[1].filter((c) => c.activo).length - a[1].filter((c) => c.activo).length)
              .map(([ciudad, centros]) => {
                const activos = centros.filter((c) => c.activo)
                const regional = activos[0]?.regional ?? ''
                const color = REGIONAL_COLOR[regional] ?? '#94a3b8'
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
                              style={{ color: pctColor(c.pctAdecuada), backgroundColor: pctColor(c.pctAdecuada) + '18' }}>
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

      {/* Centros inactivos / en proceso */}
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
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: REGIONAL_COLOR[c.regional] ?? '#94a3b8', backgroundColor: (REGIONAL_COLOR[c.regional] ?? '#94a3b8') + '18' }}>
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
