'use client'

import { useState, useMemo } from 'react'
import { GraduationCap, CheckCircle2, Users, TrendingUp, AlertTriangle, X, Send, Lightbulb } from 'lucide-react'

type ResumenCerts = Record<string, { certificadas: number; vencenEn30: number; vencidas: number }>

// ---- Module assignment ----
interface Modulo { id: string; titulo: string; tipo: 'teoria' | 'practica' | 'evaluacion'; duracion_min: number }
interface Asignacion { id: string; destino: string; tipoDestino: 'centro' | 'enfermera'; modulo: string; estado: 'pendiente' | 'enviado'; fecha: string }

const MODULOS_DISPONIBLES: Modulo[] = [
  { id: 'm1', titulo: 'Preparación intestinal: fundamentos',  tipo: 'teoria',     duracion_min: 30 },
  { id: 'm2', titulo: 'Técnica de administración del producto', tipo: 'practica',  duracion_min: 45 },
  { id: 'm3', titulo: 'Manejo de reacciones adversas',         tipo: 'teoria',     duracion_min: 25 },
  { id: 'm4', titulo: 'Comunicación efectiva con el paciente', tipo: 'practica',   duracion_min: 40 },
  { id: 'm5', titulo: 'Evaluación y certificación final',      tipo: 'evaluacion', duracion_min: 60 },
]

const CENTROS_LISTA = ['Clínica Santa Fe', 'Hospital San Vicente', 'Fundación Cardiovascular', 'Clínica del Country', 'Centro Médico Imbanaco', 'Clínica Medellín', 'Hospital Universitario']

function AsignacionPanel() {
  const [tipoDestino, setTipoDestino] = useState<'centro' | 'enfermera'>('centro')
  const [destino,     setDestino]     = useState('')
  const [moduloId,    setModuloId]    = useState('')
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([
    { id: 'a1', destino: 'Clínica Santa Fe', tipoDestino: 'centro', modulo: 'Manejo de reacciones adversas', estado: 'enviado',   fecha: '2026-03-10' },
    { id: 'a2', destino: 'Hospital San Vicente', tipoDestino: 'centro', modulo: 'Evaluación y certificación final', estado: 'pendiente', fecha: '2026-03-18' },
  ])
  const [exito, setExito] = useState(false)

  function asignar() {
    if (!destino || !moduloId) return
    const mod = MODULOS_DISPONIBLES.find((m) => m.id === moduloId)
    if (!mod) return
    const nueva: Asignacion = {
      id: `a${Date.now()}`,
      destino,
      tipoDestino,
      modulo: mod.titulo,
      estado: 'enviado',
      fecha: new Date().toISOString().slice(0, 10),
    }
    setAsignaciones((prev) => [nueva, ...prev])
    setDestino('')
    setModuloId('')
    setExito(true)
    setTimeout(() => setExito(false), 3000)
  }

  function eliminar(id: string) {
    setAsignaciones((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-navy">Asignar módulos</h3>
        <p className="text-xs text-gray-400 mt-0.5">Envía módulos de capacitación a un centro o enfermera</p>
      </div>
      <div className="p-6 space-y-4">
        {/* Form */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Asignar a</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(['centro', 'enfermera'] as const).map((t) => (
                <button key={t} onClick={() => { setTipoDestino(t); setDestino('') }}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${tipoDestino === t ? 'bg-teal text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {t === 'centro' ? 'Centro' : 'Enfermera'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              {tipoDestino === 'centro' ? 'Centro' : 'Nombre / cédula enfermera'}
            </label>
            {tipoDestino === 'centro' ? (
              <select value={destino} onChange={(e) => setDestino(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
                <option value="">Seleccionar…</option>
                {CENTROS_LISTA.map((c) => <option key={c}>{c}</option>)}
              </select>
            ) : (
              <input type="text" value={destino} onChange={(e) => setDestino(e.target.value)}
                placeholder="Ej. Ana López"
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white w-48" />
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Módulo</label>
            <select value={moduloId} onChange={(e) => setModuloId(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
              <option value="">Seleccionar módulo…</option>
              {MODULOS_DISPONIBLES.map((m) => (
                <option key={m.id} value={m.id}>{m.titulo} ({m.duracion_min} min)</option>
              ))}
            </select>
          </div>
          <button onClick={asignar} disabled={!destino || !moduloId}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-teal hover:bg-teal/90 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-colors">
            <Send className="w-3.5 h-3.5" />
            Asignar
          </button>
        </div>

        {exito && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Módulo asignado correctamente
          </div>
        )}

        {/* Historial */}
        {asignaciones.length > 0 && (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50/60 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Asignaciones recientes
            </div>
            <div className="divide-y divide-gray-100">
              {asignaciones.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${
                      a.tipoDestino === 'centro' ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal'
                    }`}>
                      {a.tipoDestino === 'centro' ? 'C' : 'E'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{a.modulo}</p>
                      <p className="text-xs text-gray-400">{a.destino} · {a.fecha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      a.estado === 'enviado' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>{a.estado === 'enviado' ? 'Enviado' : 'Pendiente'}</span>
                    <button onClick={() => eliminar(a.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface CentroCapRow {
  centro: string
  ciudad: string
  enfermeras: number
  certificadas: number
  modulosCompletos: number
  totalModulos: number
  ultimaActividad: string   // ISO date string
}

const DEMO: CentroCapRow[] = [
  { centro: 'Clínica Santa Fe',          ciudad: 'Bogotá',      enfermeras: 8,  certificadas: 7,  modulosCompletos: 35, totalModulos: 40, ultimaActividad: '2026-03-18' },
  { centro: 'Hospital San Vicente',      ciudad: 'Medellín',    enfermeras: 6,  certificadas: 4,  modulosCompletos: 24, totalModulos: 30, ultimaActividad: '2026-03-15' },
  { centro: 'Fundación Cardiovascular',  ciudad: 'Bucaramanga', enfermeras: 4,  certificadas: 4,  modulosCompletos: 20, totalModulos: 20, ultimaActividad: '2026-03-10' },
  { centro: 'Clínica del Country',       ciudad: 'Bogotá',      enfermeras: 5,  certificadas: 3,  modulosCompletos: 19, totalModulos: 25, ultimaActividad: '2026-03-05' },
  { centro: 'Centro Médico Imbanaco',    ciudad: 'Cali',        enfermeras: 4,  certificadas: 2,  modulosCompletos: 13, totalModulos: 20, ultimaActividad: '2026-02-20' },
  { centro: 'Clínica Medellín',          ciudad: 'Medellín',    enfermeras: 6,  certificadas: 6,  modulosCompletos: 30, totalModulos: 30, ultimaActividad: '2026-03-19' },
  { centro: 'Hospital Universitario',    ciudad: 'Manizales',   enfermeras: 3,  certificadas: 1,  modulosCompletos:  8, totalModulos: 15, ultimaActividad: '2026-02-10' },
]

function diasDesde(fecha: string): number {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000)
}

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
                {['Centro', 'Ciudad', 'Enfermeras', 'Certificadas', '% Certif.', 'Vigencia cert.', 'Progreso módulos', 'Última actividad'].map((h) => (
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
                    <td className="px-6 py-4">
                      {(() => {
                        const dias = diasDesde(c.ultimaActividad)
                        const label = dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : `Hace ${dias} días`
                        const color = dias <= 7 ? 'text-green-600' : dias <= 30 ? 'text-yellow-600' : 'text-red-500'
                        return (
                          <div>
                            <p className={`text-xs font-medium ${color}`}>{label}</p>
                            <p className="text-xs text-gray-400">{new Date(c.ultimaActividad).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        )
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recomendaciones por brechas */}
      <BrechasPanel centros={sorted} />

      {/* Asignación de módulos */}
      <AsignacionPanel />
    </div>
  )
}

// ---- Detección de brechas y recomendación de módulos ----
interface Brecha {
  centro: string
  ciudad: string
  tipo: 'certificacion' | 'progreso' | 'inactividad'
  moduloRecomendado: string
  detalle: string
}

function detectarBrechas(centros: CentroCapRow[]): Brecha[] {
  const brechas: Brecha[] = []
  for (const c of centros) {
    const pctCert    = c.certificadas / c.enfermeras
    const pctModulos = c.modulosCompletos / c.totalModulos
    const dias       = diasDesde(c.ultimaActividad)

    if (pctCert < 0.6) {
      brechas.push({
        centro: c.centro, ciudad: c.ciudad,
        tipo: 'certificacion',
        moduloRecomendado: 'Evaluación y certificación final',
        detalle: `Solo ${Math.round(pctCert * 100)}% certificadas — por debajo del 60% mínimo`,
      })
    } else if (pctModulos < 0.5) {
      brechas.push({
        centro: c.centro, ciudad: c.ciudad,
        tipo: 'progreso',
        moduloRecomendado: 'Preparación intestinal: fundamentos',
        detalle: `${Math.round(pctModulos * 100)}% de módulos completados — avance insuficiente`,
      })
    } else if (dias > 30) {
      brechas.push({
        centro: c.centro, ciudad: c.ciudad,
        tipo: 'inactividad',
        moduloRecomendado: 'Técnica de administración del producto',
        detalle: `Sin actividad hace ${dias} días — riesgo de desactualización`,
      })
    }
  }
  return brechas
}

const BRECHA_CFG = {
  certificacion: { label: 'Certificación baja',  color: 'bg-red-50 border-red-200 text-red-700',    dot: 'bg-red-400'    },
  progreso:      { label: 'Progreso bajo',        color: 'bg-orange-50 border-orange-200 text-orange-700', dot: 'bg-orange-400' },
  inactividad:   { label: 'Inactividad',          color: 'bg-yellow-50 border-yellow-200 text-yellow-700', dot: 'bg-yellow-400' },
}

function BrechasPanel({ centros }: { centros: CentroCapRow[] }) {
  const brechas = useMemo(() => detectarBrechas(centros), [centros])
  if (brechas.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <div>
          <h3 className="text-sm font-semibold text-navy">Recomendaciones adaptadas por brecha</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Módulos sugeridos según el estado real de cada centro
          </p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {brechas.map((b, i) => {
          const cfg = BRECHA_CFG[b.tipo]
          return (
            <div key={i} className="px-6 py-4 flex items-start gap-4">
              <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-semibold text-gray-800">{b.centro}</span>
                  <span className="text-xs text-gray-400">{b.ciudad}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1.5">{b.detalle}</p>
                <div className="inline-flex items-center gap-1.5 bg-teal/5 border border-teal/20 rounded-lg px-3 py-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                  <span className="text-xs font-medium text-teal">
                    Módulo recomendado: {b.moduloRecomendado}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
