'use client'

import { useState, useMemo } from 'react'
import { Download, Calendar } from 'lucide-react'
import { TendenciaCentroChart, ProductoCentroChart, MedicoBarChart } from './CentroCharts'
import type { TendenciaPoint, ProductoPoint, MedicoBarPoint } from './CentroCharts'
import { exportarCSV } from '@/lib/export'

export interface ProcCentro {
  id: string
  paciente: string
  cedula: string
  medico: string
  fecha: string
  producto: string
  estado: string
  prep: string
}

interface Props {
  procedimientos: ProcCentro[]
  nombreCentro: string
}

const PERIODOS = [
  { label: 'Último mes',      months: 1 },
  { label: 'Últimos 3 meses', months: 3 },
  { label: 'Últimos 6 meses', months: 6 },
  { label: 'Todo el año',     months: 12 },
]

export function CentroDashboard({ procedimientos, nombreCentro }: Props) {
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
  const adecuados   = completados.filter((p) => ['excelente', 'buena', 'regular'].includes(p.prep))
  const reprocesos  = completados.filter((p) => p.prep === 'inadecuada')
  const pctAdecuada  = completados.length > 0 ? Math.round((adecuados.length / completados.length) * 100) : 0
  const pctReproceso = completados.length > 0 ? Math.round((reprocesos.length / completados.length) * 100) : 0
  const medicosActivos = new Set(filtered.map((p) => p.medico)).size

  // Tendencia 6 meses
  const tendencia = useMemo((): TendenciaPoint[] => {
    const meses: TendenciaPoint[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const mes = d.toLocaleDateString('es-CO', { month: 'short' })
      const m = d.getMonth(); const y = d.getFullYear()
      const delMes = completados.filter((p) => { const fd = new Date(p.fecha); return fd.getMonth() === m && fd.getFullYear() === y })
      const adec = delMes.filter((p) => ['excelente', 'buena', 'regular'].includes(p.prep))
      const rep  = delMes.filter((p) => p.prep === 'inadecuada')
      meses.push({
        mes,
        prepAdecuada: delMes.length ? Math.round((adec.length / delMes.length) * 100) : 0,
        reprocesos:   delMes.length ? Math.round((rep.length  / delMes.length) * 100) : 0,
      })
    }
    return meses
  }, [completados])

  // Productos
  const productos = useMemo((): ProductoPoint[] => {
    const map: Record<string, number> = {}
    filtered.forEach((p) => { map[p.producto] = (map[p.producto] ?? 0) + 1 })
    return Object.entries(map).map(([producto, cantidad]) => ({ producto, cantidad }))
  }, [filtered])

  // Por médico
  const porMedico = useMemo((): MedicoBarPoint[] => {
    const map: Record<string, { total: number; adecuados: number }> = {}
    filtered.forEach((p) => {
      if (!map[p.medico]) map[p.medico] = { total: 0, adecuados: 0 }
      map[p.medico].total++
      if (['excelente', 'buena', 'regular'].includes(p.prep)) map[p.medico].adecuados++
    })
    return Object.entries(map)
      .map(([nombre, v]) => ({ nombre: nombre.replace('Dr. ', '').replace('Dra. ', ''), ...v }))
      .sort((a, b) => b.total - a.total)
  }, [filtered])

  function descargar() {
    exportarCSV(
      filtered.map((p) => ({
        Paciente: p.paciente,
        Cédula: p.cedula,
        Médico: p.medico,
        Fecha: new Date(p.fecha).toLocaleDateString('es-CO'),
        Producto: p.producto,
        Preparación: p.prep,
        Estado: p.estado,
      })),
      `procedimientos_${nombreCentro.replace(/\s+/g, '_')}.csv`
    )
  }

  return (
    <div className="space-y-6">
      {/* Período */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-gray-400" />
        {PERIODOS.map((p) => (
          <button key={p.months} onClick={() => setPeriodo(p.months)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              periodo === p.months ? 'bg-teal text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-teal/40'
            }`}>
            {p.label}
          </button>
        ))}
        <button onClick={descargar}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-navy border border-navy/20 hover:bg-navy/5 transition-colors px-3 py-1.5 rounded-full">
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard color="teal"  label="Procedimientos"   value={String(filtered.length)}    sub="En el período" />
        <KpiCard color="green" label="% Prep. adecuada" value={`${pctAdecuada}%`}          sub={`${adecuados.length} de ${completados.length}`} />
        <KpiCard color="red"   label="% Reprocesos"     value={`${pctReproceso}%`}         sub={`${reprocesos.length} inadecuadas`} />
        <KpiCard color="navy"  label="Médicos activos"  value={String(medicosActivos)}     sub="Con procedimientos" />
      </div>

      {/* Tendencia + Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-1">Tendencia · últimos 6 meses</h3>
          <p className="text-xs text-gray-400 mb-4">Preparación adecuada vs. % reprocesos</p>
          <TendenciaCentroChart data={tendencia} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-1">Por producto</h3>
          <p className="text-xs text-gray-400 mb-2">Distribución en el período</p>
          <ProductoCentroChart data={productos.length > 0 ? productos : [{ producto: 'Sin datos', cantidad: 1 }]} />
        </div>
      </div>

      {/* Por médico */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-navy mb-1">Colonoscopias por médico</h3>
        <p className="text-xs text-gray-400 mb-4">Total vs. preparaciones adecuadas</p>
        <MedicoBarChart data={porMedico.length > 0 ? porMedico : [{ nombre: 'Sin datos', total: 0, adecuados: 0 }]} />
      </div>

      {/* Tabla resumen médicos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-navy">Resumen por médico</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Médico', 'Procedimientos', 'Prep. adecuada', '% Adecuada', '% Reprocesos'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {porMedico.map((m) => {
                const pctA = m.total > 0 ? Math.round((m.adecuados / m.total) * 100) : 0
                const pctR = m.total > 0 ? Math.round(((m.total - m.adecuados) / m.total) * 100) : 0
                return (
                  <tr key={m.nombre} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{m.nombre}</td>
                    <td className="px-6 py-4 text-gray-600">{m.total}</td>
                    <td className="px-6 py-4 text-gray-600">{m.adecuados}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-20">
                          <div className="bg-teal h-1.5 rounded-full" style={{ width: `${pctA}%` }} />
                        </div>
                        <span className="text-xs font-medium text-teal">{pctA}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${pctR > 10 ? 'text-red-600' : 'text-gray-500'}`}>{pctR}%</span>
                    </td>
                  </tr>
                )
              })}
              {porMedico.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-400">Sin datos en el período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

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
