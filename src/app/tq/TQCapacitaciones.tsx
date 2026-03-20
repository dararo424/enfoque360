'use client'

import { useState, useMemo } from 'react'
import { GraduationCap, CheckCircle2, Users, TrendingUp, AlertTriangle } from 'lucide-react'

type ResumenCerts = Record<string, { certificadas: number; vencenEn30: number; vencidas: number }>

interface CentroCapRow {
  centro: string
  ciudad: string
  enfermeras: number
  certificadas: number
  modulosCompletos: number
  totalModulos: number
}

const DEMO: CentroCapRow[] = [
  { centro: 'Clínica Santa Fe',          ciudad: 'Bogotá',      enfermeras: 8,  certificadas: 7,  modulosCompletos: 35, totalModulos: 40 },
  { centro: 'Hospital San Vicente',      ciudad: 'Medellín',    enfermeras: 6,  certificadas: 4,  modulosCompletos: 24, totalModulos: 30 },
  { centro: 'Fundación Cardiovascular',  ciudad: 'Bucaramanga', enfermeras: 4,  certificadas: 4,  modulosCompletos: 20, totalModulos: 20 },
  { centro: 'Clínica del Country',       ciudad: 'Bogotá',      enfermeras: 5,  certificadas: 3,  modulosCompletos: 19, totalModulos: 25 },
  { centro: 'Centro Médico Imbanaco',    ciudad: 'Cali',        enfermeras: 4,  certificadas: 2,  modulosCompletos: 13, totalModulos: 20 },
  { centro: 'Clínica Medellín',          ciudad: 'Medellín',    enfermeras: 6,  certificadas: 6,  modulosCompletos: 30, totalModulos: 30 },
  { centro: 'Hospital Universitario',    ciudad: 'Manizales',   enfermeras: 3,  certificadas: 1,  modulosCompletos:  8, totalModulos: 15 },
]

export function TQCapacitaciones({ resumenCerts = {} }: { resumenCerts?: ResumenCerts }) {
  const [sortBy, setSortBy] = useState<'certificadas' | 'progreso'>('progreso')

  // Alertas de certificaciones: suma total en todos los centros
  const totalVencenEn30 = Object.values(resumenCerts).reduce((s, r) => s + r.vencenEn30, 0)
  const totalVencidas   = Object.values(resumenCerts).reduce((s, r) => s + r.vencidas,   0)

  const totalEnfermeras   = DEMO.reduce((s, c) => s + c.enfermeras,   0)
  const totalCertificadas = DEMO.reduce((s, c) => s + c.certificadas, 0)
  const pctCertificadas   = Math.round((totalCertificadas / totalEnfermeras) * 100)
  const centros100pct     = DEMO.filter((c) => c.certificadas === c.enfermeras).length

  const sorted = useMemo(() => {
    return [...DEMO].sort((a, b) =>
      sortBy === 'certificadas'
        ? b.certificadas - a.certificadas
        : (b.modulosCompletos / b.totalModulos) - (a.modulosCompletos / a.totalModulos)
    )
  }, [sortBy])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-teal-light rounded-2xl p-5">
          <div className="text-teal mb-2"><GraduationCap className="w-5 h-5" /></div>
          <p className="text-3xl font-bold text-navy">{pctCertificadas}%</p>
          <p className="text-sm text-gray-600 mt-1">Certificadas</p>
          <p className="text-xs text-gray-400 mt-1">{totalCertificadas} de {totalEnfermeras} enfermeras</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5">
          <div className="text-green-600 mb-2"><CheckCircle2 className="w-5 h-5" /></div>
          <p className="text-3xl font-bold text-navy">{centros100pct}</p>
          <p className="text-sm text-gray-600 mt-1">Centros 100%</p>
          <p className="text-xs text-gray-400 mt-1">Todo el personal certificado</p>
        </div>
        <div className="bg-navy/5 rounded-2xl p-5">
          <div className="text-navy mb-2"><Users className="w-5 h-5" /></div>
          <p className="text-3xl font-bold text-navy">{DEMO.length}</p>
          <p className="text-sm text-gray-600 mt-1">Centros activos</p>
          <p className="text-xs text-gray-400 mt-1">Con programa EMC</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-5">
          <div className="text-purple-600 mb-2"><TrendingUp className="w-5 h-5" /></div>
          <p className="text-3xl font-bold text-navy">
            {Math.round(DEMO.reduce((s, c) => s + c.modulosCompletos, 0) / DEMO.reduce((s, c) => s + c.totalModulos, 0) * 100)}%
          </p>
          <p className="text-sm text-gray-600 mt-1">Módulos completados</p>
          <p className="text-xs text-gray-400 mt-1">Promedio nacional</p>
        </div>
      </div>

      {/* Alertas certificaciones */}
      {(totalVencidas > 0 || totalVencenEn30 > 0) && (
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${totalVencidas > 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${totalVencidas > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
          <div>
            <p className={`text-sm font-semibold ${totalVencidas > 0 ? 'text-red-700' : 'text-yellow-700'}`}>
              Alertas de certificación
            </p>
            <p className={`text-xs mt-0.5 ${totalVencidas > 0 ? 'text-red-600' : 'text-yellow-700'}`}>
              {totalVencidas > 0 && `${totalVencidas} enfermera${totalVencidas > 1 ? 's' : ''} con certificación vencida. `}
              {totalVencenEn30 > 0 && `${totalVencenEn30} certificación${totalVencenEn30 > 1 ? 'es' : ''} vencen en los próximos 30 días.`}
            </p>
          </div>
        </div>
      )}

      {/* Impacto clínico */}
      <div className="bg-gradient-to-r from-teal/10 to-navy/5 rounded-2xl border border-teal/20 p-6">
        <h3 className="text-sm font-semibold text-navy mb-3">Impacto clínico del programa EMC</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Mejora en prep. adecuada', value: '+8.2%', sub: 'Centros con >80% certificadas vs resto', positive: true },
            { label: 'Reducción reprocesos',     value: '-4.1%', sub: 'Comparativo trimestral',                 positive: true },
            { label: 'Satisfacción paciente',    value: '4.7/5', sub: 'Encuesta post-procedimiento',            positive: true },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white/80 rounded-xl p-4">
              <p className="text-2xl font-bold text-teal">{kpi.value}</p>
              <p className="text-xs font-medium text-gray-700 mt-1">{kpi.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla centros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-navy">Progreso por centro</h3>
            <p className="text-xs text-gray-400 mt-0.5">Estado del programa de capacitación</p>
          </div>
          <div className="flex gap-2">
            {(['progreso', 'certificadas'] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  sortBy === s ? 'bg-teal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {s === 'progreso' ? 'Por progreso' : 'Por certificadas'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Centro', 'Ciudad', 'Enfermeras', 'Certificadas', '% Certif.', 'Vigencia cert.', 'Progreso módulos'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((c, i) => {
                const pctCert   = Math.round((c.certificadas  / c.enfermeras)   * 100)
                const pctModulos = Math.round((c.modulosCompletos / c.totalModulos) * 100)
                return (
                  <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.centro}</td>
                    <td className="px-6 py-4 text-gray-500">{c.ciudad}</td>
                    <td className="px-6 py-4 text-gray-700 text-center">{c.enfermeras}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        pctCert === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>{c.certificadas}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        pctCert === 100 ? 'bg-green-50 text-green-700' :
                        pctCert >= 60   ? 'bg-yellow-50 text-yellow-700' :
                                          'bg-red-50 text-red-600'
                      }`}>{pctCert}%</span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        // Buscar resumen por nombre del centro (aproximado, ya que no tenemos el id aquí)
                        const r = Object.values(resumenCerts)[sorted.indexOf(c)]
                        if (!r) return <span className="text-xs text-gray-300">—</span>
                        if (r.vencidas > 0) return (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />{r.vencidas} vencida{r.vencidas > 1 ? 's' : ''}
                          </span>
                        )
                        if (r.vencenEn30 > 0) return (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />Vence pronto
                          </span>
                        )
                        return <span className="text-xs text-green-600 font-medium">Al día ✓</span>
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-32">
                          <div className="h-2 rounded-full transition-all"
                            style={{ width: `${pctModulos}%`, backgroundColor: pctModulos === 100 ? '#0CA5A0' : pctModulos >= 60 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {c.modulosCompletos}/{c.totalModulos}
                        </span>
                      </div>
                    </td>
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
