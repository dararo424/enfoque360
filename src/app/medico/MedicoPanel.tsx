'use client'

import { useState, useMemo } from 'react'
import { Download, Calendar } from 'lucide-react'
import { MedicoChart, ProductoChart, HoraChart } from './MedicoCharts'
import type { TendenciaPoint, ProductoPoint, HoraPoint } from './MedicoCharts'
import { exportarCSV, exportarPDF } from '@/lib/export'

export interface ProcMedico {
  id: string
  paciente: string
  cedula: string
  fecha: string
  producto: string
  estado: string
  prep: string
  adenomas: number   // 0 = no detectados
}

interface Props {
  procedimientos: ProcMedico[]
  nombreMedico: string
  centraNombre: string
}

const PREP_BADGE: Record<string, string> = {
  excelente:  'bg-green-100 text-green-700',
  buena:      'bg-blue-100 text-blue-700',
  regular:    'bg-yellow-100 text-yellow-700',
  inadecuada: 'bg-red-100 text-red-600',
}
const PREP_LABEL: Record<string, string> = {
  excelente: 'Excelente', buena: 'Buena', regular: 'Adecuada', inadecuada: 'Inadecuada',
}

const PERIODOS = [
  { label: 'Último mes',      months: 1 },
  { label: 'Últimos 3 meses', months: 3 },
  { label: 'Últimos 6 meses', months: 6 },
  { label: 'Todo el año',     months: 12 },
]

export function MedicoPanel({ procedimientos, nombreMedico, centraNombre }: Props) {
  const [periodo, setPeriodo] = useState(3)

  const filtered = useMemo(() => {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - periodo)
    return procedimientos.filter((p) => {
      const d = new Date(p.fecha)
      return !isNaN(d.getTime()) ? d >= cutoff : true
    })
  }, [procedimientos, periodo])

  const completados = filtered.filter((p) => p.estado === 'completado')
  const adecuados    = completados.filter((p) => ['excelente', 'buena', 'regular'].includes(p.prep))
  const reprocesos   = completados.filter((p) => p.prep === 'inadecuada')
  const conAdenomas  = completados.filter((p) => p.adenomas > 0)
  const pctAdecuada  = completados.length > 0 ? Math.round((adecuados.length   / completados.length) * 100) : 0
  const pctReproceso = completados.length > 0 ? Math.round((reprocesos.length  / completados.length) * 100) : 0
  const pctAdenomas  = completados.length > 0 ? Math.round((conAdenomas.length / completados.length) * 100) : 0

  // Tendencia por mes (últimos 6 meses)
  const tendencia = useMemo((): TendenciaPoint[] => {
    const meses: TendenciaPoint[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mes = d.toLocaleDateString('es-CO', { month: 'short' })
      const m = d.getMonth()
      const y = d.getFullYear()
      const delMes = completados.filter((p) => {
        const fd = new Date(p.fecha)
        return fd.getMonth() === m && fd.getFullYear() === y
      })
      const adec      = delMes.filter((p) => ['excelente', 'buena', 'regular'].includes(p.prep))
      const reproc    = delMes.filter((p) => p.prep === 'inadecuada')
      const adenoMes  = delMes.filter((p) => p.adenomas > 0)
      meses.push({
        mes,
        prepAdecuada:      delMes.length ? Math.round((adec.length     / delMes.length) * 100) : 0,
        deteccionAdenomas: delMes.length ? Math.round((adenoMes.length / delMes.length) * 100) : 0,
        reprocesos:        delMes.length ? Math.round((reproc.length   / delMes.length) * 100) : 0,
      })
    }
    return meses
  }, [completados])

  // Distribución por producto
  const productos = useMemo((): ProductoPoint[] => {
    const map: Record<string, number> = {}
    filtered.forEach((p) => { map[p.producto] = (map[p.producto] ?? 0) + 1 })
    return Object.entries(map).map(([producto, cantidad]) => ({ producto, cantidad }))
  }, [filtered])

  // Por hora
  const porHora = useMemo((): HoraPoint[] => {
    const map: Record<string, number> = {}
    const horas = ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16']
    horas.forEach((h) => { map[h] = 0 })
    filtered.forEach((p) => {
      const d = new Date(p.fecha)
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0')
        if (map[h] !== undefined) map[h]++
      }
    })
    return horas.map((h) => ({ hora: h, total: map[h] }))
  }, [filtered])

  function descargar() {
    exportarCSV(
      filtered.map((p) => ({
        Paciente: p.paciente,
        Cédula: p.cedula,
        Fecha: p.fecha,
        Producto: p.producto,
        Preparación: PREP_LABEL[p.prep] ?? p.prep,
        Estado: p.estado,
      })),
      `procedimientos_${nombreMedico.replace(/\s+/g, '_')}.csv`
    )
  }

  function descargarPDF() {
    const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })
    exportarPDF({
      titulo: `Reporte Médico · ${nombreMedico}`,
      subtitulo: `${centraNombre} · ${fecha} · ${PERIODOS.find((p) => p.months === periodo)?.label ?? ''}`,
      columnas: ['Paciente', 'Cédula', 'Fecha', 'Producto', 'Preparación', 'Estado'],
      filas: recientes.map((p) => [
        p.paciente, p.cedula,
        new Date(p.fecha).toLocaleDateString('es-CO'),
        p.producto,
        PREP_LABEL[p.prep] ?? p.prep,
        p.estado === 'completado' ? 'Completado' : p.estado === 'en_curso' ? 'En curso' : 'Programado',
      ]),
      nombreArchivo: `procedimientos_${nombreMedico.replace(/\s+/g, '_')}.pdf`,
    })
  }

  const recientes = [...filtered].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Filtro período */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-gray-400" />
        {PERIODOS.map((p) => (
          <button key={p.months}
            onClick={() => setPeriodo(p.months)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              periodo === p.months
                ? 'bg-teal text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal/40'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={descargar}
            className="flex items-center gap-1.5 text-xs font-semibold text-navy border border-navy/20 hover:bg-navy/5 transition-colors px-3 py-1.5 rounded-full"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button onClick={descargarPDF}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy/90 transition-colors px-3 py-1.5 rounded-full"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard color="teal"   label="Procedimientos"       value={String(filtered.length)}    sub="En el período seleccionado" />
        <KpiCard color="green"  label="% Prep. adecuada"     value={`${pctAdecuada}%`}          sub={`${adecuados.length} de ${completados.length} completados`} />
        <KpiCard color="red"    label="% Reprocesos"         value={`${pctReproceso}%`}         sub={`${reprocesos.length} prep. inadecuadas`} />
        <KpiCard color="purple" label="Detección adenomas"   value={`${pctAdenomas}%`}          sub={`Meta ASGE: >25% ${pctAdenomas >= 25 ? '✓' : '—'}`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tendencia */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-1">Tendencia · últimos 6 meses</h3>
          <p className="text-xs text-gray-400 mb-1">Preparación adecuada vs. reprocesos</p>
          <div className="flex gap-5 mb-3 flex-wrap">
            <LegendDot color="#0CA5A0" label="Prep. adecuada" />
            <LegendDot color="#ef4444" label="% Reprocesos" dashed />
            <LegendDot color="#6366f1" label="Detección adenomas" dashed />
          </div>
          <MedicoChart data={tendencia} />
        </div>

        {/* Productos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-1">Por producto</h3>
          <p className="text-xs text-gray-400 mb-2">Distribución en el período</p>
          <ProductoChart data={productos.length > 0 ? productos : [{ producto: 'Sin datos', cantidad: 1 }]} />
        </div>
      </div>

      {/* Horarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-navy mb-1">Distribución horaria</h3>
        <p className="text-xs text-gray-400 mb-4">Procedimientos por franja horaria</p>
        <HoraChart data={porHora} />
      </div>

      {/* Últimos procedimientos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-navy">Últimos procedimientos</h3>
          <p className="text-xs text-gray-400 mt-0.5">Los más recientes del período</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Paciente', 'Fecha', 'Producto', 'Preparación', 'Estado'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recientes.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{p.paciente}</p>
                    <p className="text-xs text-gray-400">{p.cedula}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{p.fecha}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-navy/70 bg-navy/5 px-2 py-1 rounded-lg">{p.producto}</span>
                  </td>
                  <td className="px-6 py-4">
                    {p.prep && PREP_BADGE[p.prep] ? (
                      <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${PREP_BADGE[p.prep]}`}>
                        {PREP_LABEL[p.prep]}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      p.estado === 'completado' ? 'bg-green-50 text-green-700' :
                      p.estado === 'en_curso'   ? 'bg-yellow-50 text-yellow-700' :
                                                  'bg-gray-50 text-gray-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        p.estado === 'completado' ? 'bg-green-500' :
                        p.estado === 'en_curso'   ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      {p.estado === 'completado' ? 'Completado' : p.estado === 'en_curso' ? 'En curso' : 'Programado'}
                    </span>
                  </td>
                </tr>
              ))}
              {recientes.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-400">Sin procedimientos en el período seleccionado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---- Helpers ----
function KpiCard({ color, label, value, sub }: { color: string; label: string; value: string; sub: string }) {
  const themes: Record<string, { bg: string; text: string }> = {
    teal:  { bg: 'bg-teal-light', text: 'text-teal' },
    navy:  { bg: 'bg-navy/5',     text: 'text-navy' },
    green: { bg: 'bg-green-50',   text: 'text-green-600' },
    red:   { bg: 'bg-red-50',     text: 'text-red-600' },
  }
  const t = themes[color] ?? themes.teal
  return (
    <div className={`${t.bg} rounded-2xl p-5`}>
      <p className={`text-3xl font-bold ${t.text}`}>{value}</p>
      <p className="text-sm text-gray-600 mt-1 leading-tight">{label}</p>
      <p className="text-xs text-gray-400 mt-1 leading-tight">{sub}</p>
    </div>
  )
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-6 h-0.5" style={{ backgroundColor: dashed ? 'transparent' : color }}>
        {dashed
          ? <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(90deg,${color} 0,${color} 4px,transparent 4px,transparent 7px)` }} />
          : null}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
