'use client'

/**
 * Geographic view of active centers in Colombia.
 * Colombia outline derived from real lat/lon boundary coordinates.
 *
 * Projection (Mercator-like, linear for this scale):
 *   ViewBox: 0 0 260 310
 *   Lon range: -79.0 → -66.8  (12.2°)  →  x = (lon + 79) / 12.2 * 228 + 16
 *   Lat range:  12.8 →  -4.2  (17.0°)  →  y = (12.8 - lat) / 17.0 * 282 + 14
 */

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

// Project lon/lat → SVG x/y
function proj(lon: number, lat: number): [number, number] {
  const x = (lon + 79) / 12.2 * 228 + 16
  const y = (12.8 - lat) / 17.0 * 282 + 14
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
}

// City positions (real coordinates)
const CIUDADES: Record<string, { lon: number; lat: number }> = {
  Barranquilla: { lon: -74.80, lat: 11.00 },
  Cartagena:    { lon: -75.51, lat: 10.39 },
  Bucaramanga:  { lon: -73.13, lat:  7.13 },
  Cúcuta:       { lon: -72.51, lat:  7.89 },
  Medellín:     { lon: -75.57, lat:  6.24 },
  Manizales:    { lon: -75.52, lat:  5.07 },
  Pereira:      { lon: -75.70, lat:  4.81 },
  Bogotá:       { lon: -74.08, lat:  4.71 },
  Cali:         { lon: -76.52, lat:  3.43 },
}

// Approximate Colombia boundary (clockwise, simplified but geographically accurate)
// Points are (lon, lat) pairs that will be projected
const BOUNDARY: [number, number][] = [
  // Northwest – Gulf of Urabá / Panama
  [-77.35,  8.55], [-77.25,  9.00], [-76.90,  9.45], [-76.55, 10.00],
  // Caribbean coast → Barranquilla → Guajira
  [-75.70, 10.40], [-75.10, 10.85], [-74.75, 11.05], [-74.35, 11.25],
  [-73.60, 11.58], [-73.00, 11.85], [-72.55, 12.15], [-72.10, 12.38],
  [-71.70, 12.45],
  // Guajira → Venezuela border (NE → SE)
  [-71.30, 12.05], [-71.90, 11.42], [-72.20,  9.95], [-72.38,  8.08],
  [-72.05,  7.10],
  // Venezuela border going south
  [-71.00,  6.98], [-70.10,  6.25], [-68.50,  5.00], [-67.50,  3.85],
  [-67.85,  2.82], [-67.30,  1.70], [-66.90,  1.20],
  // Brazil border (S) + Amazon
  [-69.85,  1.70], [-70.05, -0.15], [-70.05, -2.20],
  // Peru border
  [-73.80, -2.22], [-75.25, -0.12],
  // Ecuador border
  [-75.89,  0.27], [-76.40,  0.40], [-77.45,  0.58], [-77.85,  0.80],
  [-78.29,  1.37],
  // Pacific coast going N
  [-78.85,  2.58], [-77.95,  4.18], [-77.30,  5.55],
  [-77.50,  6.60], [-77.38,  7.42], [-77.10,  7.95], [-77.35,  8.55],
]

const COLOMBIA_D = BOUNDARY.map((p, i) => {
  const [x, y] = proj(p[0], p[1])
  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
}).join(' ') + ' Z'

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

export function TQMapa() {
  const byCity = CENTROS.reduce<Record<string, Centro[]>>((acc, c) => {
    if (!acc[c.ciudad]) acc[c.ciudad] = []
    acc[c.ciudad].push(c)
    return acc
  }, {})

  const totalActivos  = CENTROS.filter((c) =>  c.activo).length
  const totalProcs    = CENTROS.filter((c) =>  c.activo).reduce((s, c) => s + c.procedimientos, 0)
  const ciudadesCount = [...new Set(CENTROS.filter((c) => c.activo).map((c) => c.ciudad))].length

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
        {/* SVG Map */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-1">Distribución geográfica</h3>
          <p className="text-xs text-gray-400 mb-4">Centros activos · Colombia</p>

          <div className="flex justify-center">
            <svg viewBox="0 0 260 310" width="260" height="310" className="overflow-visible">
              {/* Ocean / background */}
              <rect width="260" height="310" fill="#f0f9ff" rx="12" />

              {/* Colombia fill */}
              <path d={COLOMBIA_D} fill="#e8f4f8" stroke="#94a3b8" strokeWidth="1" />

              {/* City pins */}
              {Object.entries(byCity).map(([ciudad, centros]) => {
                const coords = CIUDADES[ciudad]
                if (!coords) return null
                const activos = centros.filter((c) => c.activo)
                if (activos.length === 0) return null
                const [cx, cy] = proj(coords.lon, coords.lat)
                const regional = activos[0].regional
                const color = REGIONAL_COLOR[regional] ?? '#94a3b8'
                const r = 5 + activos.length * 2.5

                // Label offset: nudge to avoid overlap
                const labelOffset: Record<string, [number, number]> = {
                  Barranquilla: [0, -14],
                  Bucaramanga:  [12, 0],
                  Cúcuta:       [12, 0],
                  Medellín:     [-14, -6],
                  Manizales:    [-16, 4],
                  Pereira:      [-14, 4],
                  Bogotá:       [10, 4],
                  Cali:         [-14, 4],
                }
                const [lx, ly] = labelOffset[ciudad] ?? [0, -14]

                return (
                  <g key={ciudad}>
                    {/* Pulse ring */}
                    <circle cx={cx} cy={cy} r={r + 4} fill={color} opacity={0.18} />
                    {/* Pin circle */}
                    <circle cx={cx} cy={cy} r={r} fill={color} />
                    {/* Count label */}
                    {activos.length > 1 && (
                      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="7.5" fill="white" fontWeight="700">
                        {activos.length}
                      </text>
                    )}
                    {/* City name */}
                    <text
                      x={cx + lx} y={cy + ly}
                      textAnchor={lx > 0 ? 'start' : lx < 0 ? 'end' : 'middle'}
                      fontSize="7.5" fill="#334155" fontWeight="500"
                    >
                      {ciudad}
                    </text>
                  </g>
                )
              })}
            </svg>
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
            <p className="text-xs text-gray-400 mt-0.5">Solo centros activos</p>
          </div>
          <div className="overflow-y-auto max-h-[360px] divide-y divide-gray-50">
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
