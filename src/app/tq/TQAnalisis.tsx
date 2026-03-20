'use client'

import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import { exportarCSV } from '@/lib/export'

interface Fila {
  centro: string
  ciudad: string
  regional: string
  producto: string
  mes: string
  edadGrupo: string
  procedimientos: number
  pctAdecuada: number
  pctReprocesos: number
}

// Demo data
const DATOS: Fila[] = [
  { centro: 'Clínica Santa Fe',         ciudad: 'Bogotá',      regional: 'Centro',       producto: 'COLONLYTELY', mes: 'Feb', edadGrupo: '50-59', procedimientos: 22, pctAdecuada: 92, pctReprocesos: 8  },
  { centro: 'Clínica Santa Fe',         ciudad: 'Bogotá',      regional: 'Centro',       producto: 'COLONLYTELY', mes: 'Feb', edadGrupo: '60-69', procedimientos: 18, pctAdecuada: 91, pctReprocesos: 9  },
  { centro: 'Clínica Santa Fe',         ciudad: 'Bogotá',      regional: 'Centro',       producto: 'COLONLYTELY', mes: 'Feb', edadGrupo: '≥70',   procedimientos:  8, pctAdecuada: 88, pctReprocesos: 12 },
  { centro: 'Clínica Santa Fe',         ciudad: 'Bogotá',      regional: 'Centro',       producto: 'TRAVAD PIK',  mes: 'Feb', edadGrupo: '50-59', procedimientos: 20, pctAdecuada: 90, pctReprocesos: 10 },
  { centro: 'Clínica Santa Fe',         ciudad: 'Bogotá',      regional: 'Centro',       producto: 'TRAVAD PIK',  mes: 'Feb', edadGrupo: '60-69', procedimientos: 16, pctAdecuada: 87, pctReprocesos: 13 },
  { centro: 'Clínica Santa Fe',         ciudad: 'Bogotá',      regional: 'Centro',       producto: 'COLONLYTELY', mes: 'Mar', edadGrupo: '50-59', procedimientos: 28, pctAdecuada: 94, pctReprocesos: 6  },
  { centro: 'Clínica Santa Fe',         ciudad: 'Bogotá',      regional: 'Centro',       producto: 'COLONLYTELY', mes: 'Mar', edadGrupo: '60-69', procedimientos: 24, pctAdecuada: 92, pctReprocesos: 8  },
  { centro: 'Hospital San Vicente',     ciudad: 'Medellín',    regional: 'Antioquia',    producto: 'TRAVAD PIK',  mes: 'Feb', edadGrupo: '40-49', procedimientos: 15, pctAdecuada: 89, pctReprocesos: 11 },
  { centro: 'Hospital San Vicente',     ciudad: 'Medellín',    regional: 'Antioquia',    producto: 'TRAVAD PIK',  mes: 'Feb', edadGrupo: '50-59', procedimientos: 18, pctAdecuada: 87, pctReprocesos: 13 },
  { centro: 'Hospital San Vicente',     ciudad: 'Medellín',    regional: 'Antioquia',    producto: 'TRAVAD PIK',  mes: 'Feb', edadGrupo: '≥70',   procedimientos:  7, pctAdecuada: 82, pctReprocesos: 18 },
  { centro: 'Hospital San Vicente',     ciudad: 'Medellín',    regional: 'Antioquia',    producto: 'NULYTELY',    mes: 'Feb', edadGrupo: '50-59', procedimientos: 15, pctAdecuada: 86, pctReprocesos: 14 },
  { centro: 'Hospital San Vicente',     ciudad: 'Medellín',    regional: 'Antioquia',    producto: 'NULYTELY',    mes: 'Feb', edadGrupo: '60-69', procedimientos: 13, pctAdecuada: 84, pctReprocesos: 16 },
  { centro: 'Hospital San Vicente',     ciudad: 'Medellín',    regional: 'Antioquia',    producto: 'TRAVAD PIK',  mes: 'Mar', edadGrupo: '50-59', procedimientos: 25, pctAdecuada: 89, pctReprocesos: 11 },
  { centro: 'Hospital San Vicente',     ciudad: 'Medellín',    regional: 'Antioquia',    producto: 'TRAVAD PIK',  mes: 'Mar', edadGrupo: '60-69', procedimientos: 20, pctAdecuada: 87, pctReprocesos: 13 },
  { centro: 'Fundación Cardiovascular', ciudad: 'Bucaramanga', regional: 'Nororiente',   producto: 'COLONLYTELY', mes: 'Feb', edadGrupo: '50-59', procedimientos: 17, pctAdecuada: 84, pctReprocesos: 16 },
  { centro: 'Fundación Cardiovascular', ciudad: 'Bucaramanga', regional: 'Nororiente',   producto: 'COLONLYTELY', mes: 'Feb', edadGrupo: '60-69', procedimientos: 13, pctAdecuada: 82, pctReprocesos: 18 },
  { centro: 'Fundación Cardiovascular', ciudad: 'Bucaramanga', regional: 'Nororiente',   producto: 'COLONLYTELY', mes: 'Mar', edadGrupo: '50-59', procedimientos: 20, pctAdecuada: 87, pctReprocesos: 13 },
  { centro: 'Fundación Cardiovascular', ciudad: 'Bucaramanga', regional: 'Nororiente',   producto: 'COLONLYTELY', mes: 'Mar', edadGrupo: '60-69', procedimientos: 15, pctAdecuada: 85, pctReprocesos: 15 },
  { centro: 'Clínica del Country',      ciudad: 'Bogotá',      regional: 'Centro',       producto: 'NULYTELY',    mes: 'Mar', edadGrupo: '40-49', procedimientos: 10, pctAdecuada: 85, pctReprocesos: 15 },
  { centro: 'Clínica del Country',      ciudad: 'Bogotá',      regional: 'Centro',       producto: 'NULYTELY',    mes: 'Mar', edadGrupo: '50-59', procedimientos: 12, pctAdecuada: 80, pctReprocesos: 20 },
  { centro: 'Centro Médico Imbanaco',   ciudad: 'Cali',        regional: 'Suroccidente', producto: 'TRAVAD PIK',  mes: 'Mar', edadGrupo: '50-59', procedimientos: 20, pctAdecuada: 81, pctReprocesos: 19 },
  { centro: 'Centro Médico Imbanaco',   ciudad: 'Cali',        regional: 'Suroccidente', producto: 'TRAVAD PIK',  mes: 'Mar', edadGrupo: '60-69', procedimientos: 18, pctAdecuada: 79, pctReprocesos: 21 },
]

type DimKey = 'centro' | 'ciudad' | 'regional' | 'producto' | 'mes' | 'edadGrupo'
type MetricKey = 'procedimientos' | 'pctAdecuada' | 'pctReprocesos'

const DIMS: { key: DimKey; label: string }[] = [
  { key: 'regional',  label: 'Regional'    },
  { key: 'ciudad',    label: 'Ciudad'      },
  { key: 'centro',    label: 'Centro'      },
  { key: 'producto',  label: 'Producto'    },
  { key: 'mes',       label: 'Mes'         },
  { key: 'edadGrupo', label: 'Grupo etario'},
]

const METRICS: { key: MetricKey; label: string; format: (v: number) => string }[] = [
  { key: 'procedimientos', label: 'Procedimientos', format: (v) => v.toLocaleString('es-CO') },
  { key: 'pctAdecuada',    label: '% Prep. adecuada', format: (v) => `${v.toFixed(1)}%` },
  { key: 'pctReprocesos',  label: '% Reprocesos',  format: (v) => `${v.toFixed(1)}%` },
]

export function TQAnalisis() {
  const [fila,    setFila]    = useState<DimKey>('regional')
  const [columna, setColumna] = useState<DimKey>('producto')
  const [metrica, setMetrica] = useState<MetricKey>('pctAdecuada')

  const met = METRICS.find((m) => m.key === metrica)!

  const filaVals = useMemo(() => [...new Set(DATOS.map((d) => d[fila]))].sort(), [fila])
  const colVals  = useMemo(() => [...new Set(DATOS.map((d) => d[columna]))].sort(), [columna])

  function agg(filaVal: string, colVal: string): number {
    const sub = DATOS.filter((d) => d[fila] === filaVal && d[columna] === colVal)
    if (!sub.length) return 0
    if (metrica === 'procedimientos') return sub.reduce((s, d) => s + d.procedimientos, 0)
    // promedio ponderado para porcentajes
    const totalProc = sub.reduce((s, d) => s + d.procedimientos, 0)
    return totalProc > 0 ? sub.reduce((s, d) => s + d[metrica] * d.procedimientos, 0) / totalProc : 0
  }

  function descargar() {
    const rows = filaVals.map((f) => {
      const obj: Record<string, string | number> = { [fila]: f }
      colVals.forEach((c) => { obj[c] = agg(f, c) })
      return obj
    })
    exportarCSV(rows, 'analisis_pivot.csv')
  }

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Filas</label>
          <select value={fila} onChange={(e) => setFila(e.target.value as DimKey)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            {DIMS.filter((d) => d.key !== columna).map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Columnas</label>
          <select value={columna} onChange={(e) => setColumna(e.target.value as DimKey)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            {DIMS.filter((d) => d.key !== fila).map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Métrica</label>
          <select value={metrica} onChange={(e) => setMetrica(e.target.value as MetricKey)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        <button onClick={descargar}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-navy border border-navy/20 hover:bg-navy/5 px-3 py-2 rounded-xl transition-colors">
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Pivot table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-navy">Tabla dinámica · {met.label}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Filas: {DIMS.find((d) => d.key === fila)?.label} · Columnas: {DIMS.find((d) => d.key === columna)?.label}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {DIMS.find((d) => d.key === fila)?.label}
                </th>
                {colVals.map((c) => (
                  <th key={c} className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">{c}</th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-semibold text-teal uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filaVals.map((f) => {
                const vals  = colVals.map((c) => agg(f, c))
                const total = metrica === 'procedimientos'
                  ? vals.reduce((s, v) => s + v, 0)
                  : vals.filter((v) => v > 0).length > 0
                    ? vals.filter((v) => v > 0).reduce((s, v) => s + v, 0) / vals.filter((v) => v > 0).length
                    : 0
                return (
                  <tr key={f} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{f}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="px-6 py-4 text-right">
                        {v > 0 ? (
                          <span className={`text-sm font-medium ${
                            metrica === 'pctAdecuada'   && v >= 85 ? 'text-green-600' :
                            metrica === 'pctReprocesos' && v > 15  ? 'text-red-600'   : 'text-gray-700'
                          }`}>
                            {met.format(v)}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right font-semibold text-navy">{met.format(total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
