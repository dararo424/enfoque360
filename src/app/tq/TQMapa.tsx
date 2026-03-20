'use client'

/**
 * Geographic overview of active centers in Colombia.
 * Colombia outline is hand-drawn (schematic) for a recognizable silhouette.
 * City dots are manually positioned to match the outline shape.
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

/**
 * Hand-placed city coordinates inside the SVG outline below.
 * Positions derived from real geography adapted to the schematic shape.
 */
const CIUDAD_SVG: Record<string, { x: number; y: number; labelDx: number; labelDy: number }> = {
  Barranquilla: { x:  96, y:  27, labelDx:   0, labelDy: -11 },
  Cartagena:    { x:  72, y:  38, labelDx: -10, labelDy: -10 },
  Bucaramanga:  { x: 142, y:  97, labelDx:  11, labelDy:   0 },
  Cúcuta:       { x: 160, y:  76, labelDx:  11, labelDy:   0 },
  Medellín:     { x:  76, y: 130, labelDx: -12, labelDy:  -5 },
  Manizales:    { x:  82, y: 152, labelDx: -14, labelDy:   5 },
  Pereira:      { x:  73, y: 161, labelDx: -12, labelDy:   5 },
  Bogotá:       { x: 120, y: 158, labelDx:  11, labelDy:   4 },
  Cali:         { x:  60, y: 190, labelDx: -11, labelDy:   4 },
}

/**
 * Colombia outline — clockwise from northwest (Gulf of Urabá / Pacific).
 * ViewBox: 0 0 260 300
 * This is a schematic silhouette, not a mathematically projected map.
 */
const COLOMBIA =
  'M 42 90 L 38 75 L 44 60 L 60 46 L 76 36 ' +        // NW coast → Caribbean
  'L 97 27 L 116 20 L 138 12 L 157 4 ' +              // Caribbean coast → Guajira tip
  'L 170 10 L 164 26 L 160 47 L 157 72 ' +            // Venezuela border (N)
  'L 165 95 L 178 112 L 200 133 L 222 158 ' +         // Venezuela / Llanos
  'L 228 185 L 222 215 ' +                             // Far east / Orinoco
  'L 200 248 L 170 263 L 140 270 ' +                  // Brazil / Amazon
  'L 108 264 L 85 250 L 62 234 ' +                    // Peru border
  'L 44 210 L 28 182 L 22 155 L 25 125 L 32 105 Z'   // Pacific coast → close

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

          <svg viewBox="0 0 260 300" width="100%" style={{ maxWidth: 300 }} className="block mx-auto">
            {/* Ocean */}
            <rect width="260" height="300" fill="#e8f4fb" rx="10" />

            {/* Colombia silhouette */}
            <path d={COLOMBIA} fill="#dde8ed" stroke="#94a3b8" strokeWidth="1.2" strokeLinejoin="round" />

            {/* City pins */}
            {Object.entries(byCity).map(([ciudad, centros]) => {
              const pos = CIUDAD_SVG[ciudad]
              if (!pos) return null
              const activos = centros.filter((c) => c.activo)
              if (activos.length === 0) return null
              const regional = activos[0].regional
              const color    = REGIONAL_COLOR[regional] ?? '#94a3b8'
              const r        = 5 + activos.length * 2.5
              const lAnchor  = pos.labelDx > 0 ? 'start' : pos.labelDx < 0 ? 'end' : 'middle'

              return (
                <g key={ciudad}>
                  {/* Pulse ring */}
                  <circle cx={pos.x} cy={pos.y} r={r + 4} fill={color} opacity={0.18} />
                  {/* Pin */}
                  <circle cx={pos.x} cy={pos.y} r={r} fill={color} />
                  {/* Count */}
                  {activos.length > 1 && (
                    <text x={pos.x} y={pos.y + 3.5}
                      textAnchor="middle" fontSize="7.5" fill="white" fontWeight="700">
                      {activos.length}
                    </text>
                  )}
                  {/* City label */}
                  <text
                    x={pos.x + pos.labelDx}
                    y={pos.y + pos.labelDy}
                    textAnchor={lAnchor}
                    fontSize="7.2" fill="#1e293b" fontWeight="500"
                  >
                    {ciudad}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 justify-center">
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
