'use client'

import { useState } from 'react'
import {
  Users, Activity, CheckCircle2, Clock,
  X, ChevronDown,
} from 'lucide-react'
import type { ProcRow } from './page'

// ---- Badge de preparación ----
const PREP_CONFIG: Record<string, { label: string; className: string }> = {
  excelente:  { label: 'Excelente',  className: 'bg-green-100 text-green-700' },
  buena:      { label: 'Buena',      className: 'bg-blue-100 text-blue-700' },
  regular:    { label: 'Adecuada',   className: 'bg-yellow-100 text-yellow-700' },
  inadecuada: { label: 'Inadecuada', className: 'bg-red-100 text-red-700' },
}

// ---- Badge de estado ----
const ESTADO_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  programado: { label: 'Programado', className: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  en_curso:   { label: 'En curso',   className: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  completado: { label: 'Completado', className: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  cancelado:  { label: 'Cancelado',  className: 'bg-red-100 text-red-600',     dot: 'bg-red-400' },
}

// ---- Modal de indicadores ----
function IndicadoresModal({
  proc,
  onClose,
}: {
  proc: ProcRow
  onClose: (updated?: Partial<ProcRow>) => void
}) {
  const [form, setForm] = useState({
    preparacion:      proc.indicadores.preparacion ?? '',
    intubacion_cecal: proc.indicadores.intubacion_cecal ?? '',
    tiempo_retirada:  proc.indicadores.tiempo_retirada ?? '',
    adenomas:         proc.indicadores.adenomas ?? '',
    eventos_adversos: proc.indicadores.eventos_adversos ?? '',
    observaciones:    proc.indicadores.observaciones ?? '',
  })
  const [estado, setEstado] = useState(proc.estado)
  const [saving, setSaving] = useState(false)

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    // In production: call Supabase update here
    await new Promise((r) => setTimeout(r, 600))
    onClose({ indicadores: form as Record<string,string>, estado, preparacion: form.preparacion || null })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium text-teal uppercase tracking-wide">Registrar indicadores</p>
            <h3 className="text-base font-semibold text-navy mt-0.5">{proc.paciente}</h3>
            <p className="text-xs text-gray-400">{proc.hora} · {proc.medico} · {proc.producto}</p>
          </div>
          <button onClick={() => onClose()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors mt-0.5">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
          {/* Estado */}
          <Field label="Estado del procedimiento">
            <Select
              value={estado}
              onChange={(v) => setEstado(v as ProcRow['estado'])}
              options={[
                { value: 'programado', label: 'Programado' },
                { value: 'en_curso',   label: 'En curso' },
                { value: 'completado', label: 'Completado' },
                { value: 'cancelado',  label: 'Cancelado' },
              ]}
            />
          </Field>

          {/* Preparación */}
          <Field label="Calidad de preparación colónica">
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'excelente',  label: 'Excelente',  sub: 'Boston 8–9' },
                { v: 'buena',      label: 'Buena',       sub: 'Boston 6–7' },
                { v: 'regular',    label: 'Adecuada',   sub: 'Boston 4–5' },
                { v: 'inadecuada', label: 'Inadecuada', sub: 'Boston ≤3' },
              ].map(({ v, label, sub }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('preparacion', v)}
                  className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                    form.preparacion === v
                      ? 'border-teal bg-teal/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-medium ${form.preparacion === v ? 'text-teal' : 'text-gray-700'}`}>{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </button>
              ))}
            </div>
          </Field>

          {/* Intubación cecal + tiempo de retirada */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Intubación cecal">
              <div className="flex gap-3">
                {['Sí', 'No'].map((opt) => (
                  <label key={opt} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    form.intubacion_cecal === opt ? 'border-teal bg-teal/5 text-teal' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="cecal" value={opt} checked={form.intubacion_cecal === opt} onChange={() => set('intubacion_cecal', opt)} className="sr-only" />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Tiempo retirada (min)">
              <input
                type="number" min={0} max={60}
                value={form.tiempo_retirada}
                onChange={(e) => set('tiempo_retirada', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal transition-colors"
                placeholder="6"
              />
            </Field>
          </div>

          {/* Adenomas */}
          <Field label="Detección de adenomas">
            <div className="flex items-center gap-3">
              <div className="flex gap-3 flex-1">
                {['Sí', 'No'].map((opt) => (
                  <label key={opt} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    (opt === 'Sí' ? Number(form.adenomas) > 0 : form.adenomas === '0')
                      ? 'border-teal bg-teal/5 text-teal'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                    <input type="radio" name="adenomas_bool" checked={opt === 'Sí' ? Number(form.adenomas) > 0 : form.adenomas === '0'} onChange={() => set('adenomas', opt === 'Sí' ? '1' : '0')} className="sr-only" />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
              {Number(form.adenomas) > 0 && (
                <div className="w-20">
                  <input
                    type="number" min={1} max={20}
                    value={form.adenomas}
                    onChange={(e) => set('adenomas', e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:border-teal transition-colors"
                    placeholder="N°"
                  />
                </div>
              )}
            </div>
          </Field>

          {/* Eventos adversos */}
          <Field label="Eventos adversos">
            <textarea
              rows={2}
              value={form.eventos_adversos}
              onChange={(e) => set('eventos_adversos', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal transition-colors resize-none"
              placeholder="Ninguno..."
            />
          </Field>

          {/* Observaciones */}
          <Field label="Observaciones generales">
            <textarea
              rows={2}
              value={form.observaciones}
              onChange={(e) => set('observaciones', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal transition-colors resize-none"
              placeholder="Observaciones del procedimiento..."
            />
          </Field>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => onClose()} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-dark transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar indicadores'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Helpers de form ----
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal transition-colors bg-white"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

// ---- Dashboard principal ----
export function ProcedimientosDashboard({ procedimientos }: { procedimientos: ProcRow[] }) {
  const [rows, setRows] = useState(procedimientos)
  const [modal, setModal] = useState<ProcRow | null>(null)

  const total      = rows.length
  const enCurso    = rows.filter((r) => r.estado === 'en_curso').length
  const completados = rows.filter((r) => r.estado === 'completado').length
  const adecuados  = rows.filter((r) => ['excelente', 'buena', 'regular'].includes(r.preparacion ?? '')).length
  const pctPrep    = completados > 0 ? Math.round((adecuados / completados) * 100) : null

  function handleClose(updated?: Partial<ProcRow>) {
    if (updated && modal) {
      setRows((prev) =>
        prev.map((r) => (r.id === modal.id ? { ...r, ...updated } : r))
      )
    }
    setModal(null)
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label="Procedimientos hoy"
          value={total.toString()}
          theme="teal"
        />
        <KpiCard
          icon={<Activity className="w-5 h-5" />}
          label="En curso ahora"
          value={enCurso.toString()}
          theme="orange"
        />
        <KpiCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="% Preparación adecuada"
          value={pctPrep !== null ? `${pctPrep}%` : '—'}
          sublabel={completados > 0 ? `${adecuados} de ${completados} completados` : 'Sin datos aún'}
          theme="green"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-navy">Procedimientos del día</h3>
            <p className="text-xs text-gray-400 mt-0.5">{total} programados</p>
          </div>
          <Clock className="w-4 h-4 text-gray-300" />
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
                const prepCfg  = row.preparacion ? PREP_CONFIG[row.preparacion]  : null
                const estadoCfg = ESTADO_CONFIG[row.estado]
                return (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    <Td>
                      <span className="font-mono text-xs text-gray-500">{row.hora}</span>
                    </Td>
                    <Td>
                      <p className="font-medium text-gray-900">{row.paciente}</p>
                      <p className="text-xs text-gray-400">{row.cedula}</p>
                    </Td>
                    <Td className="hidden md:table-cell text-gray-600">{row.medico}</Td>
                    <Td className="hidden lg:table-cell">
                      <span className="text-xs font-medium text-navy/70 bg-navy/5 px-2 py-1 rounded-lg">{row.producto}</span>
                    </Td>
                    <Td>
                      {prepCfg ? (
                        <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${prepCfg.className}`}>
                          {prepCfg.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${estadoCfg.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />
                        {estadoCfg.label}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <button
                        onClick={() => setModal(row)}
                        disabled={row.estado === 'cancelado'}
                        className="text-xs font-semibold text-teal hover:text-teal-dark disabled:text-gray-300 disabled:cursor-not-allowed transition-colors px-3 py-1.5 rounded-lg hover:bg-teal/5"
                      >
                        Registrar
                      </button>
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

function KpiCard({
  icon, label, value, sublabel, theme,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sublabel?: string
  theme: 'teal' | 'orange' | 'green'
}) {
  const themes = {
    teal:   { bg: 'bg-teal-light', icon: 'text-teal',        value: 'text-navy' },
    orange: { bg: 'bg-orange-50',  icon: 'text-orange-500',  value: 'text-navy' },
    green:  { bg: 'bg-green-50',   icon: 'text-green-600',   value: 'text-navy' },
  }
  const t = themes[theme]
  return (
    <div className={`${t.bg} rounded-2xl p-5`}>
      <div className={`${t.icon} mb-3`}>{icon}</div>
      <p className={`text-3xl font-bold ${t.value}`}>{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  )
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide ${className}`}>
      {children}
    </th>
  )
}

function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>
}
