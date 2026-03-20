'use client'

import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import { exportarCSV } from '@/lib/export'

interface ProductoMix { producto: string; cantidad: number }

interface InversionRow {
  medico: string
  centro: string
  regional: string
  periodo: string
  capacitaciones: number
  procedimientos: number
  monto: number
  rendimiento: number // procedimientos / capacitaciones
  mezcla: ProductoMix[]
}

const DEMO: InversionRow[] = [
  { medico: 'Dr. Carlos Hernández',   centro: 'Clínica Santa Fe',          regional: 'Centro',       periodo: '2026-Q1', capacitaciones: 4, procedimientos: 52, monto: 1200000, rendimiento: 13,    mezcla: [{ producto: 'COLONLYTELY', cantidad: 30 }, { producto: 'TRAVAD PIK', cantidad: 22 }] },
  { medico: 'Dra. Laura Martínez',    centro: 'Clínica Santa Fe',          regional: 'Centro',       periodo: '2026-Q1', capacitaciones: 3, procedimientos: 38, monto: 900000,  rendimiento: 12.7,  mezcla: [{ producto: 'TRAVAD PIK', cantidad: 25 }, { producto: 'NULYTELY', cantidad: 13 }] },
  { medico: 'Dr. Andrés Torres',      centro: 'Hospital San Vicente',      regional: 'Antioquia',    periodo: '2026-Q1', capacitaciones: 5, procedimientos: 48, monto: 1500000, rendimiento: 9.6,   mezcla: [{ producto: 'TRAVAD PIK', cantidad: 28 }, { producto: 'COLONLYTELY', cantidad: 20 }] },
  { medico: 'Dra. Sofía Ríos',        centro: 'Hospital San Vicente',      regional: 'Antioquia',    periodo: '2026-Q1', capacitaciones: 2, procedimientos: 30, monto: 600000,  rendimiento: 15,    mezcla: [{ producto: 'COLONLYTELY', cantidad: 18 }, { producto: 'NULYTELY', cantidad: 12 }] },
  { medico: 'Dr. Felipe Castro',      centro: 'Fundación Cardiovascular',  regional: 'Nororiente',   periodo: '2026-Q1', capacitaciones: 3, procedimientos: 35, monto: 900000,  rendimiento: 11.7,  mezcla: [{ producto: 'COLONLYTELY', cantidad: 35 }] },
  { medico: 'Dra. Paola Gómez',       centro: 'Clínica del Country',       regional: 'Centro',       periodo: '2026-Q1', capacitaciones: 4, procedimientos: 43, monto: 1200000, rendimiento: 10.75, mezcla: [{ producto: 'NULYTELY', cantidad: 25 }, { producto: 'TRAVAD PIK', cantidad: 18 }] },
  { medico: 'Dr. Miguel Suárez',      centro: 'Centro Médico Imbanaco',    regional: 'Suroccidente', periodo: '2026-Q1', capacitaciones: 2, procedimientos: 25, monto: 600000,  rendimiento: 12.5,  mezcla: [{ producto: 'TRAVAD PIK', cantidad: 25 }] },
  { medico: 'Dra. Claudia Vargas',    centro: 'Clínica Medellín',          regional: 'Antioquia',    periodo: '2026-Q1', capacitaciones: 6, procedimientos: 58, monto: 1800000, rendimiento: 9.7,   mezcla: [{ producto: 'TRAVAD PIK', cantidad: 32 }, { producto: 'COLONLYTELY', cantidad: 26 }] },
]

const MIX_COLORS: Record<string, string> = {
  'COLONLYTELY': '#0CA5A0',
  'TRAVAD PIK':  '#0F2D52',
  'NULYTELY':    '#6366f1',
}

function MixBar({ mezcla, total }: { mezcla: ProductoMix[]; total: number }) {
  return (
    <div className="flex flex-col gap-1 min-w-32">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {mezcla.map((m) => (
          <div key={m.producto}
            style={{ width: `${Math.round((m.cantidad / total) * 100)}%`, backgroundColor: MIX_COLORS[m.producto] ?? '#94a3b8' }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {mezcla.map((m) => (
          <span key={m.producto} className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: MIX_COLORS[m.producto] ?? '#94a3b8' }} />
            {m.producto} {Math.round((m.cantidad / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}

const PERIODOS = ['2026-Q1', '2025-Q4', '2025-Q3', '2025-Q2']

export function TQInversion() {
  const [periodo,  setPeriodo]  = useState('2026-Q1')
  const [regional, setRegional] = useState('')

  const regionales = useMemo(() => [...new Set(DEMO.map((r) => r.regional))].sort(), [])

  const filtrados = useMemo(() =>
    DEMO.filter((r) =>
      r.periodo === periodo &&
      (!regional || r.regional === regional)
    ), [periodo, regional])

  const totalMonto     = filtrados.reduce((s, r) => s + r.monto,         0)
  const totalCaps      = filtrados.reduce((s, r) => s + r.capacitaciones, 0)
  const totalProcs     = filtrados.reduce((s, r) => s + r.procedimientos, 0)
  const rendPromedio   = totalCaps > 0 ? (totalProcs / totalCaps).toFixed(1) : '—'

  function descargar() {
    exportarCSV(
      filtrados.map((r) => ({
        Médico: r.medico,
        Centro: r.centro,
        Regional: r.regional,
        Período: r.periodo,
        Capacitaciones: r.capacitaciones,
        Procedimientos: r.procedimientos,
        'Monto invertido': r.monto,
        'Rendimiento (proc/cap)': r.rendimiento,
        'Mezcla de productos': r.mezcla.map((m) => `${m.producto}:${m.cantidad}`).join(' | '),
      })),
      `inversion_emc_${periodo}.csv`
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-teal-light rounded-2xl p-5">
          <p className="text-3xl font-bold text-teal">{filtrados.length}</p>
          <p className="text-sm text-gray-600 mt-1">Médicos con EMC</p>
          <p className="text-xs text-gray-400 mt-1">{periodo}</p>
        </div>
        <div className="bg-navy/5 rounded-2xl p-5">
          <p className="text-3xl font-bold text-navy">{totalCaps}</p>
          <p className="text-sm text-gray-600 mt-1">Capacitaciones</p>
          <p className="text-xs text-gray-400 mt-1">Total del período</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-green-600">{rendPromedio}</p>
          <p className="text-sm text-gray-600 mt-1">Proc. / capacitación</p>
          <p className="text-xs text-gray-400 mt-1">Rendimiento promedio</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-5">
          <p className="text-2xl font-bold text-purple-600">
            ${(totalMonto / 1000000).toFixed(1)}M
          </p>
          <p className="text-sm text-gray-600 mt-1">Inversión total</p>
          <p className="text-xs text-gray-400 mt-1">{totalProcs} procedimientos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Período</label>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            {PERIODOS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Regional</label>
          <select value={regional} onChange={(e) => setRegional(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            <option value="">Todas</option>
            {regionales.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={descargar}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-navy border border-navy/20 hover:bg-navy/5 px-3 py-2 rounded-xl transition-colors">
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Médico', 'Centro', 'Regional', 'Capacitaciones', 'Procedimientos', 'Rendimiento', 'Inversión', 'Mezcla de productos'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{r.medico}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{r.centro}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{r.regional}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal/10 text-teal text-xs font-bold">{r.capacitaciones}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{r.procedimientos}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-16">
                        <div className="bg-teal h-1.5 rounded-full" style={{ width: `${Math.min((r.rendimiento / 20) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{r.rendimiento.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ${(r.monto / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-6 py-4">
                    <MixBar mezcla={r.mezcla} total={r.procedimientos} />
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-xs text-gray-400">Sin datos para el período seleccionado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
