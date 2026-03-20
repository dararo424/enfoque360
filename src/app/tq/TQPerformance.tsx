'use client'

import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import { TendenciaChart, ProductosChart } from './TQCharts'
import { exportarCSV, exportarPDF } from '@/lib/export'

export interface CentroPerf {
  nombre: string
  ciudad: string
  regional: string
  procedimientos: number
  pctAdecuada: number
  pctReprocesos: number
}

const CENTROS_DEMO: CentroPerf[] = [
  { nombre: 'Clínica Santa Fe',          ciudad: 'Bogotá',      regional: 'Centro', procedimientos: 284, pctAdecuada: 91, pctReprocesos: 9  },
  { nombre: 'Hospital San Vicente Paúl', ciudad: 'Medellín',    regional: 'Antioquia', procedimientos: 198, pctAdecuada: 88, pctReprocesos: 12 },
  { nombre: 'Fundación Cardiovascular',  ciudad: 'Bucaramanga', regional: 'Nororiente', procedimientos: 156, pctAdecuada: 86, pctReprocesos: 14 },
  { nombre: 'Clínica del Country',       ciudad: 'Bogotá',      regional: 'Centro', procedimientos: 143, pctAdecuada: 84, pctReprocesos: 16 },
  { nombre: 'Centro Médico Imbanaco',    ciudad: 'Cali',        regional: 'Suroccidente', procedimientos: 128, pctAdecuada: 82, pctReprocesos: 18 },
  { nombre: 'Clínica Medellín',          ciudad: 'Medellín',    regional: 'Antioquia', procedimientos: 117, pctAdecuada: 81, pctReprocesos: 19 },
  { nombre: 'Hospital Universitario',    ciudad: 'Manizales',   regional: 'Eje Cafetero', procedimientos:  98, pctAdecuada: 79, pctReprocesos: 21 },
]

const TENDENCIA = [
  { mes: 'Oct', pct: 78, reprocesos: 22 },
  { mes: 'Nov', pct: 81, reprocesos: 19 },
  { mes: 'Dic', pct: 80, reprocesos: 20 },
  { mes: 'Ene', pct: 83, reprocesos: 17 },
  { mes: 'Feb', pct: 85, reprocesos: 15 },
  { mes: 'Mar', pct: 87, reprocesos: 13 },
]

const PRODUCTOS = [
  { nombre: 'TRAVAD PIK',  valor: 45 },
  { nombre: 'COLONLYTELY', valor: 35 },
  { nombre: 'NULYTELY',    valor: 20 },
]

function pctColor(pct: number) {
  if (pct >= 85) return 'text-green-600 bg-green-50'
  if (pct >= 75) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export function TQPerformance({ centros = CENTROS_DEMO }: { centros?: CentroPerf[] }) {
  const [regional, setRegional] = useState('')
  const [ciudad,   setCiudad]   = useState('')
  const [producto, setProducto] = useState('')

  const regionales = useMemo(() => [...new Set(centros.map((c) => c.regional))].sort(), [centros])
  const ciudades   = useMemo(() => [...new Set(centros.filter((c) => !regional || c.regional === regional).map((c) => c.ciudad))].sort(), [centros, regional])

  const filtrados = useMemo(() =>
    centros.filter((c) =>
      (!regional || c.regional === regional) &&
      (!ciudad   || c.ciudad   === ciudad)
    ), [centros, regional, ciudad])

  function descargar() {
    exportarCSV(
      filtrados.map((c) => ({
        Centro: c.nombre, Ciudad: c.ciudad, Regional: c.regional,
        Procedimientos: c.procedimientos, '% Adecuada': c.pctAdecuada, '% Reprocesos': c.pctReprocesos,
      })),
      'performance_nacional.csv'
    )
  }

  function descargarPDF() {
    const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })
    exportarPDF({
      titulo: 'Performance Nacional · Enfoque 360',
      subtitulo: `Generado el ${fecha}${regional ? ` · Regional: ${regional}` : ''}${ciudad ? ` · Ciudad: ${ciudad}` : ''}`,
      columnas: ['Centro', 'Ciudad', 'Regional', 'Procedimientos', '% Adecuada', '% Reprocesos'],
      filas: filtrados.map((c) => [c.nombre, c.ciudad, c.regional, c.procedimientos, `${c.pctAdecuada}%`, `${c.pctReprocesos}%`]),
      nombreArchivo: 'performance_nacional.pdf',
    })
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Regional</label>
          <select value={regional} onChange={(e) => { setRegional(e.target.value); setCiudad('') }}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            <option value="">Todas</option>
            {regionales.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Ciudad</label>
          <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            <option value="">Todas</option>
            {ciudades.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Producto</label>
          <select value={producto} onChange={(e) => setProducto(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            <option value="">Todos</option>
            {['TRAVAD PIK', 'COLONLYTELY', 'NULYTELY'].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={descargar}
            className="flex items-center gap-1.5 text-xs font-semibold text-navy border border-navy/20 hover:bg-navy/5 px-3 py-2 rounded-xl transition-colors">
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button onClick={descargarPDF}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy/90 px-3 py-2 rounded-xl transition-colors">
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-0.5">Tendencia preparación adecuada</h3>
          <p className="text-xs text-gray-400 mb-4">Últimos 6 meses · nacional</p>
          <TendenciaChart data={TENDENCIA} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-0.5">Distribución de productos</h3>
          <p className="text-xs text-gray-400 mb-2">Participación por preparación</p>
          <ProductosChart data={PRODUCTOS} />
        </div>
      </div>

      {/* Tabla centros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-navy">Desempeño por centro</h3>
            <p className="text-xs text-gray-400 mt-0.5">{filtrados.length} centros</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Centro', 'Ciudad', 'Regional', 'Procedimientos', '% Adecuada', '% Reprocesos', 'Progreso'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-6 py-4 text-gray-500">{c.ciudad}</td>
                  <td className="px-6 py-4 text-gray-500">{c.regional}</td>
                  <td className="px-6 py-4 font-medium">{c.procedimientos.toLocaleString('es-CO')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${pctColor(c.pctAdecuada)}`}>
                      {c.pctAdecuada}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${c.pctReprocesos > 15 ? 'text-red-600' : 'text-gray-500'}`}>
                      {c.pctReprocesos}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${c.pctAdecuada}%`, backgroundColor: c.pctAdecuada >= 85 ? '#0CA5A0' : c.pctAdecuada >= 75 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{c.pctAdecuada}%</span>
                    </div>
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
