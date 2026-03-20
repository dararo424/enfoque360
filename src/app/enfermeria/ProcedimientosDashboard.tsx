'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Activity, CheckCircle2, Clock, X, ChevronDown, Play, Square, ClipboardList, GraduationCap } from 'lucide-react'
import {
  guardarIndicadoresProcedimiento,
  iniciarProcedimiento,
  finalizarProcedimiento,
} from '@/lib/actions'
import type { ProcRow } from './page'

// ---- Configuraciones visuales ----
const PREP_CFG: Record<string, { label: string; className: string }> = {
  excelente:  { label: 'Excelente',  className: 'bg-green-100 text-green-700' },
  buena:      { label: 'Buena',      className: 'bg-blue-100 text-blue-700' },
  regular:    { label: 'Adecuada',   className: 'bg-yellow-100 text-yellow-700' },
  inadecuada: { label: 'Inadecuada', className: 'bg-red-100 text-red-700' },
}

const ESTADO_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  programado: { label: 'Programado', cls: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  en_curso:   { label: 'En curso',   cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500 animate-pulse' },
  completado: { label: 'Completado', cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-600',      dot: 'bg-red-400' },
}

function esUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

// ---- Modal de indicadores ----
function IndicadoresModal({ proc, onClose }: { proc: ProcRow; onClose: (upd?: Partial<ProcRow>) => void }) {
  const [form, setForm] = useState({
    preparacion:      proc.indicadores.preparacion ?? '',
    intubacion_cecal: proc.indicadores.intubacion_cecal ?? '',
    tiempo_retirada:  proc.indicadores.tiempo_retirada ?? '',
    adenomas:         proc.indicadores.adenomas ?? '',
    lesiones_serradas: proc.indicadores.lesiones_serradas ?? '',
    eventos_adversos: proc.indicadores.eventos_adversos ?? '',
    observaciones:    proc.indicadores.observaciones ?? '',
    horas_prescritas: proc.indicadores.horas_prescritas ?? '',
  })
  const [estado, setEstado]     = useState(proc.estado)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const router = useRouter()

  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await guardarIndicadoresProcedimiento(proc.id, form, estado)
      onClose({ indicadores: form as Record<string,string>, estado, preparacion: form.preparacion || null })
      if (esUUID(proc.id)) router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const prepPac = proc.preparacion_paciente

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 z-10">
          <div>
            <p className="text-xs font-semibold text-teal uppercase tracking-wide">Registrar indicadores</p>
            <h3 className="text-base font-semibold text-navy mt-0.5">{proc.paciente}</h3>
            <p className="text-xs text-gray-400">{proc.hora} · {proc.medico} · {proc.producto}</p>
          </div>
          <button onClick={() => onClose()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors mt-0.5">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Preparación del paciente (solo lectura) */}
        {prepPac && (
          <div className="mx-6 mt-4 bg-teal/5 border border-teal/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              Preparación registrada por el paciente
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {prepPac.producto          && <Row l="Producto"   v={prepPac.producto} />}
              {prepPac.horas_ayuno       && <Row l="Ayuno"      v={`${prepPac.horas_ayuno} horas`} />}
              {prepPac.alimentos_consumidos && <Row l="Alimentos" v={prepPac.alimentos_consumidos} />}
              {prepPac.observaciones     && <Row l="Obs. paciente" v={prepPac.observaciones} />}
              {prepPac.registrado_en     && (
                <Row l="Registrado" v={new Date(prepPac.registrado_en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} />
              )}
            </div>
          </div>
        )}

        {!prepPac && (
          <div className="mx-6 mt-4 bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5" />
            El paciente aún no ha registrado su preparación
          </div>
        )}

        {/* Horas prescritas vs realizadas */}
        {prepPac?.horas_ayuno && (
          <div className="mx-6 mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ayuno: prescritas vs. realizadas</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-navy">
                  {form.horas_prescritas || <span className="text-gray-300 text-base">—</span>}
                  {form.horas_prescritas ? <span className="text-xs font-normal text-gray-500 ml-1">h</span> : null}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Prescritas</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${
                form.horas_prescritas && Number(prepPac.horas_ayuno) < Number(form.horas_prescritas)
                  ? 'bg-red-50' : 'bg-green-50'
              }`}>
                <p className={`text-2xl font-bold ${
                  form.horas_prescritas && Number(prepPac.horas_ayuno) < Number(form.horas_prescritas)
                    ? 'text-red-600' : 'text-green-600'
                }`}>
                  {prepPac.horas_ayuno}<span className="text-xs font-normal text-gray-500 ml-1">h</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Realizadas (paciente)</p>
              </div>
            </div>
            {form.horas_prescritas && Number(prepPac.horas_ayuno) < Number(form.horas_prescritas) && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                ⚠ El paciente realizó {Number(form.horas_prescritas) - Number(prepPac.horas_ayuno)}h menos de ayuno del prescrito
              </p>
            )}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-5">

          {/* Estado */}
          <Field label="Estado del procedimiento">
            <div className="relative">
              <select value={estado} onChange={(e) => setEstado(e.target.value as ProcRow['estado'])}
                className="w-full appearance-none px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal bg-white">
                <option value="programado">Programado</option>
                <option value="en_curso">En curso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* Calidad de preparación */}
          <Field label="Calidad de preparación colónica">
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'excelente',  l: 'Excelente',  s: 'Boston 8–9' },
                { v: 'buena',      l: 'Buena',       s: 'Boston 6–7' },
                { v: 'regular',    l: 'Adecuada',    s: 'Boston 4–5' },
                { v: 'inadecuada', l: 'Inadecuada',  s: 'Boston ≤3' },
              ].map(({ v, l, s }) => (
                <button key={v} type="button" onClick={() => set('preparacion', v)}
                  className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                    form.preparacion === v ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <p className={`text-sm font-medium ${form.preparacion === v ? 'text-teal' : 'text-gray-700'}`}>{l}</p>
                  <p className="text-xs text-gray-400">{s}</p>
                </button>
              ))}
            </div>
          </Field>

          {/* Intubación cecal + tiempo retirada */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Intubación cecal">
              <div className="flex gap-2">
                {['Sí', 'No'].map((opt) => (
                  <label key={opt} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    form.intubacion_cecal === opt ? 'border-teal bg-teal/5 text-teal' : 'border-gray-200 text-gray-600'
                  }`}>
                    <input type="radio" name="cecal" value={opt} checked={form.intubacion_cecal === opt}
                      onChange={() => set('intubacion_cecal', opt)} className="sr-only" />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Retirada (min)">
              <input type="number" min={0} max={60} value={form.tiempo_retirada}
                onChange={(e) => set('tiempo_retirada', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal"
                placeholder="6" />
            </Field>
          </div>

          {/* Adenomas */}
          <Field label="Detección de adenomas">
            <div className="flex items-center gap-3">
              <div className="flex gap-2 flex-1">
                {['Sí', 'No'].map((opt) => (
                  <label key={opt} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    (opt === 'Sí' ? Number(form.adenomas) > 0 : form.adenomas === '0')
                      ? 'border-teal bg-teal/5 text-teal' : 'border-gray-200 text-gray-600'
                  }`}>
                    <input type="radio" name="adenomas_bool"
                      checked={opt === 'Sí' ? Number(form.adenomas) > 0 : form.adenomas === '0'}
                      onChange={() => set('adenomas', opt === 'Sí' ? '1' : '0')} className="sr-only" />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
              {Number(form.adenomas) > 0 && (
                <input type="number" min={1} max={20} value={form.adenomas}
                  onChange={(e) => set('adenomas', e.target.value)}
                  className="w-16 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:border-teal"
                  placeholder="N°" />
              )}
            </div>
          </Field>

          {/* Lesiones serradas */}
          <Field label="Detección de lesiones serradas">
            <div className="flex gap-2">
              {['Sí', 'No'].map((opt) => (
                <label key={opt} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                  form.lesiones_serradas === opt ? 'border-teal bg-teal/5 text-teal' : 'border-gray-200 text-gray-600'
                }`}>
                  <input type="radio" name="serradas" value={opt}
                    checked={form.lesiones_serradas === opt}
                    onChange={() => set('lesiones_serradas', opt)} className="sr-only" />
                  <span className="text-sm font-medium">{opt}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* Eventos adversos */}
          <Field label="Eventos adversos">
            <textarea rows={2} value={form.eventos_adversos}
              onChange={(e) => set('eventos_adversos', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal resize-none"
              placeholder="Ninguno..." />
          </Field>

          {/* Horas prescritas */}
          <Field label="Horas de ayuno prescritas">
            <div className="flex items-center gap-3">
              <input type="number" min={0} max={24} value={form.horas_prescritas}
                onChange={(e) => set('horas_prescritas', e.target.value)}
                className="w-24 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal text-center"
                placeholder="8" />
              <span className="text-sm text-gray-500">horas</span>
            </div>
          </Field>

          {/* Observaciones */}
          <Field label="Observaciones generales">
            <textarea rows={2} value={form.observaciones}
              onChange={(e) => set('observaciones', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal resize-none"
              placeholder="Observaciones del procedimiento..." />
          </Field>

          {!esUUID(proc.id) && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Modo demo — conecta Supabase para persistir los datos.
            </p>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => onClose()}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-dark disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar indicadores'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <>
      <span className="text-gray-400">{l}</span>
      <span className="font-medium text-gray-700 truncate">{v}</span>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  )
}

// ---- Dashboard principal ----
export function ProcedimientosDashboard({ procedimientos }: { procedimientos: ProcRow[] }) {
  const [rows, setRows]       = useState(procedimientos)
  const [modal, setModal]     = useState<ProcRow | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const total      = rows.length
  const enCurso    = rows.filter((r) => r.estado === 'en_curso').length
  const completados = rows.filter((r) => r.estado === 'completado').length
  const adecuados  = rows.filter((r) => ['excelente', 'buena', 'regular'].includes(r.preparacion ?? '')).length
  const pctPrep    = completados > 0 ? Math.round((adecuados / completados) * 100) : null

  function handleClose(upd?: Partial<ProcRow>) {
    if (upd && modal) {
      setRows((prev) => prev.map((r) => (r.id === modal.id ? { ...r, ...upd } : r)))
    }
    setModal(null)
  }

  function accionar(row: ProcRow, accion: 'iniciar' | 'finalizar') {
    // Optimista
    const nuevoEstado = accion === 'iniciar' ? 'en_curso' : 'completado'
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, estado: nuevoEstado } : r))

    startTransition(async () => {
      try {
        if (accion === 'iniciar') await iniciarProcedimiento(row.id)
        else                       await finalizarProcedimiento(row.id)
        if (esUUID(row.id)) router.refresh()
      } catch {
        // Revertir en caso de error
        setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, estado: row.estado } : r))
      }
    })
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard icon={<Users className="w-5 h-5" />}      label="Procedimientos hoy"       value={total.toString()}                                             theme="teal" />
        <KpiCard icon={<Activity className="w-5 h-5" />}   label="En curso ahora"           value={enCurso.toString()}                                           theme="orange" />
        <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="% Preparación adecuada" value={pctPrep !== null ? `${pctPrep}%` : '—'}
          sublabel={completados > 0 ? `${adecuados} de ${completados} completados` : 'Sin datos aún'} theme="green" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-navy">Procedimientos del día</h3>
            <p className="text-xs text-gray-400 mt-0.5">{total} programados</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/centro"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-navy transition-colors">
              Mi Centro
            </a>
            <a href="/enfermeria/capacitacion"
              className="flex items-center gap-1.5 text-xs font-medium text-teal hover:text-teal-dark transition-colors">
              <GraduationCap className="w-4 h-4" />
              Capacitación
            </a>
            <Clock className="w-4 h-4 text-gray-300" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <Th>Hora</Th>
                <Th>Paciente</Th>
                <Th className="hidden md:table-cell">Médico</Th>
                <Th className="hidden lg:table-cell">Producto</Th>
                <Th>Preparación</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acción</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const prepCfg   = row.preparacion ? PREP_CFG[row.preparacion] : null
                const estadoCfg = ESTADO_CFG[row.estado]
                return (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    <Td><span className="font-mono text-xs text-gray-500">{row.hora}</span></Td>
                    <Td>
                      <p className="font-medium text-gray-900">{row.paciente}</p>
                      <p className="text-xs text-gray-400">{row.cedula}</p>
                      {row.preparacion_paciente && (
                        <p className="text-xs text-teal mt-0.5">✓ Prep. registrada</p>
                      )}
                    </Td>
                    <Td className="hidden md:table-cell text-gray-600 text-xs">{row.medico}</Td>
                    <Td className="hidden lg:table-cell">
                      <span className="text-xs font-medium text-navy/70 bg-navy/5 px-2 py-1 rounded-lg">{row.producto}</span>
                    </Td>
                    <Td>
                      {prepCfg
                        ? <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${prepCfg.className}`}>{prepCfg.label}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${estadoCfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />
                        {estadoCfg.label}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón Iniciar */}
                        {row.estado === 'programado' && (
                          <button onClick={() => accionar(row, 'iniciar')} disabled={pending}
                            title="Iniciar procedimiento"
                            className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-40">
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Botón Finalizar */}
                        {row.estado === 'en_curso' && (
                          <button onClick={() => accionar(row, 'finalizar')} disabled={pending}
                            title="Finalizar procedimiento"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40">
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Botón Registrar */}
                        {row.estado !== 'cancelado' && (
                          <button onClick={() => setModal(row)}
                            className="text-xs font-semibold text-teal hover:text-teal-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-teal/5">
                            Registrar
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <IndicadoresModal proc={modal} onClose={handleClose} />}
    </>
  )
}

// ---- Helpers visuales ----
function KpiCard({ icon, label, value, sublabel, theme }: {
  icon: React.ReactNode; label: string; value: string; sublabel?: string
  theme: 'teal' | 'orange' | 'green'
}) {
  const t = { teal: { bg: 'bg-teal-light', icon: 'text-teal' }, orange: { bg: 'bg-orange-50', icon: 'text-orange-500' }, green: { bg: 'bg-green-50', icon: 'text-green-600' } }[theme]
  return (
    <div className={`${t.bg} rounded-2xl p-5`}>
      <div className={`${t.icon} mb-3`}>{icon}</div>
      <p className="text-3xl font-bold text-navy">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  )
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide ${className}`}>{children}</th>
}

function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>
}
