'use client'

import { useState } from 'react'
import { CheckCircle, ChevronRight, ChevronLeft, User, Pill, FileText, ClipboardCheck, AlertCircle } from 'lucide-react'
import { registrarPreparacionPaciente } from '@/lib/actions'

interface FormData {
  nombre: string
  cedula: string
  edad: string
  telefono: string
  producto: string
  horasAyuno: string
  alimentosConsumidos: string
  observaciones: string
  consentimiento: boolean
}

const PASOS = [
  { num: 1, label: 'Datos personales', icon: User },
  { num: 2, label: 'Preparación',      icon: Pill },
  { num: 3, label: 'Confirmación',     icon: FileText },
]

// ---- Barra de progreso ----
function BarraProgreso({ paso }: { paso: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {PASOS.map((p, i) => {
        const completado = paso > p.num
        const activo     = paso === p.num
        const Icon       = p.icon
        return (
          <div key={p.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                completado ? 'bg-teal text-white' :
                activo     ? 'bg-navy text-white ring-4 ring-navy/20' :
                             'bg-gray-100 text-gray-400'
              }`}>
                {completado ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                activo ? 'text-navy' : completado ? 'text-teal' : 'text-gray-400'
              }`}>
                {p.label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 mb-5 transition-all duration-500 ${
                paso > p.num ? 'bg-teal' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---- Helpers UI ----
function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal transition-colors ${props.className ?? ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal transition-colors resize-none"
    />
  )
}

// ---- Pantalla de confirmación ----
function PantallaConfirmacion({ data, id }: { data: FormData; id: string }) {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
        <ClipboardCheck className="w-8 h-8 text-teal" />
      </div>
      <h3 className="text-xl font-bold text-navy mb-1">¡Registro exitoso!</h3>
      <p className="text-sm text-gray-500 mb-6">Tu preparación ha sido registrada correctamente.</p>

      <div className="bg-teal/5 border border-teal/20 rounded-2xl px-6 py-4 mb-6 inline-block min-w-[280px]">
        <p className="text-xs text-teal font-semibold uppercase tracking-wider mb-1">ID de registro</p>
        <p className="text-2xl font-bold text-navy font-mono tracking-widest">{id}</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Resumen</p>
        {[
          { label: 'Paciente',      value: data.nombre },
          { label: 'Cédula',        value: data.cedula },
          { label: 'Edad',          value: `${data.edad} años` },
          { label: 'Producto',      value: data.producto },
          { label: 'Horas de ayuno', value: `${data.horasAyuno} horas` },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="font-medium text-gray-900">{row.value}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Muestra este ID al equipo de enfermería el día del procedimiento.
      </p>
    </div>
  )
}

// ---- Componente principal ----
export function FormularioPaciente({ nombreDefault = '', cedulaDefault = '' }: {
  nombreDefault?: string
  cedulaDefault?: string
}) {
  const [paso, setPaso]       = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [idRegistro, setId]   = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorServer, setErrorServer] = useState<string | null>(null)
  const [errores, setErrores] = useState<Partial<Record<keyof FormData, string>>>({})

  const [form, setForm] = useState<FormData>({
    nombre:              nombreDefault,
    cedula:              cedulaDefault,
    edad:                '',
    telefono:            '',
    producto:            '',
    horasAyuno:          '',
    alimentosConsumidos: '',
    observaciones:       '',
    consentimiento:      false,
  })

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrores((e) => ({ ...e, [k]: undefined }))
    setErrorServer(null)
  }

  function validarPaso1() {
    const e: typeof errores = {}
    if (!form.nombre.trim())  e.nombre = 'El nombre es requerido'
    if (!form.cedula.trim())  e.cedula = 'La cédula es requerida'
    if (!form.edad || Number(form.edad) < 1 || Number(form.edad) > 120)
                              e.edad   = 'Ingresa una edad válida'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function validarPaso2() {
    const e: typeof errores = {}
    if (!form.producto)   e.producto   = 'Selecciona un producto'
    if (!form.horasAyuno) e.horasAyuno = 'Selecciona las horas de ayuno'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function validarPaso3() {
    const e: typeof errores = {}
    if (!form.consentimiento) e.consentimiento = 'Debes aceptar el consentimiento informado'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function siguiente() {
    if (paso === 1 && !validarPaso1()) return
    if (paso === 2 && !validarPaso2()) return
    setPaso((p) => p + 1)
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!validarPaso3()) return
    setEnviando(true)
    setErrorServer(null)
    try {
      const result = await registrarPreparacionPaciente({
        nombre:              form.nombre,
        cedula:              form.cedula,
        edad:                Number(form.edad),
        telefono:            form.telefono || undefined,
        producto:            form.producto,
        horasAyuno:          form.horasAyuno,
        alimentosConsumidos: form.alimentosConsumidos,
        observaciones:       form.observaciones,
        consentimiento:      form.consentimiento,
      })
      setId(result.id)
      setEnviado(true)
    } catch (err) {
      setErrorServer(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) return <PantallaConfirmacion data={form} id={idRegistro} />

  return (
    <div>
      <BarraProgreso paso={paso} />

      <form onSubmit={enviar} className="space-y-5">

        {/* ---- PASO 1: Datos personales ---- */}
        {paso === 1 && (
          <div className="space-y-4">
            <Campo label="Nombre completo" error={errores.nombre}>
              <Input
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder="Ej. María García López"
              />
            </Campo>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Número de cédula" error={errores.cedula}>
                <Input
                  value={form.cedula}
                  onChange={(e) => set('cedula', e.target.value)}
                  placeholder="Ej. 52.847.163"
                />
              </Campo>
              <Campo label="Edad (años)" error={errores.edad}>
                <Input
                  type="number" min={1} max={120}
                  value={form.edad}
                  onChange={(e) => set('edad', e.target.value)}
                  placeholder="Ej. 55"
                />
              </Campo>
            </div>
            <Campo label="WhatsApp (opcional)">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">+57</span>
                <Input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => set('telefono', e.target.value)}
                  placeholder="300 123 4567"
                  className="pl-12"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Para enviarte recordatorios antes de tu procedimiento</p>
            </Campo>
          </div>
        )}

        {/* ---- PASO 2: Preparación ---- */}
        {paso === 2 && (
          <div className="space-y-4">
            <Campo label="Producto utilizado para preparación" error={errores.producto}>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'TRAVAD PIK',  desc: 'Solución de pikosulfato de sodio' },
                  { value: 'COLONLYTELY', desc: 'Polietilenglicol 4L' },
                  { value: 'NULYTELY',    desc: 'Polietilenglicol + electrolitos' },
                  { value: 'OTRO',        desc: 'Otro producto indicado por el médico' },
                ].map(({ value, desc }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.producto === value ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" name="producto" value={value} checked={form.producto === value}
                      onChange={() => set('producto', value)} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      form.producto === value ? 'border-teal' : 'border-gray-300'
                    }`}>
                      {form.producto === value && <div className="w-2 h-2 rounded-full bg-teal" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${form.producto === value ? 'text-teal' : 'text-gray-700'}`}>{value}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Campo>

            <Campo label="Horas de ayuno completadas" error={errores.horasAyuno}>
              <div className="flex gap-2 flex-wrap">
                {['4', '6', '8', '10', '12', '+12'].map((h) => (
                  <button key={h} type="button" onClick={() => set('horasAyuno', h)}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.horasAyuno === h ? 'border-teal bg-teal/5 text-teal' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {h}h
                  </button>
                ))}
              </div>
            </Campo>

            <Campo label="Alimentos o líquidos consumidos en las últimas 24 horas">
              <Textarea rows={3} value={form.alimentosConsumidos}
                onChange={(e) => set('alimentosConsumidos', e.target.value)}
                placeholder="Ej. Solo líquidos claros desde las 6pm de ayer..." />
            </Campo>
          </div>
        )}

        {/* ---- PASO 3: Confirmación ---- */}
        {paso === 3 && (
          <div className="space-y-4">
            <Campo label="Observaciones adicionales">
              <Textarea rows={3} value={form.observaciones}
                onChange={(e) => set('observaciones', e.target.value)}
                placeholder="Síntomas, alergias, medicamentos o cualquier observación relevante..." />
            </Campo>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Resumen</p>
              {[
                { label: 'Paciente',   value: form.nombre },
                { label: 'Cédula',     value: form.cedula },
                { label: 'Producto',   value: form.producto },
                { label: 'Ayuno',      value: form.horasAyuno ? `${form.horasAyuno} horas` : '—' },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="font-medium text-gray-800">{r.value || '—'}</span>
                </div>
              ))}
            </div>

            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              form.consentimiento ? 'border-teal bg-teal/5' : errores.consentimiento ? 'border-red-300' : 'border-gray-200'
            }`}>
              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                form.consentimiento ? 'bg-teal border-teal' : 'border-gray-300'
              }`}>
                {form.consentimiento && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input type="checkbox" checked={form.consentimiento}
                onChange={(e) => set('consentimiento', e.target.checked)} className="sr-only" />
              <div>
                <p className="text-sm font-medium text-gray-800">Consentimiento informado</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Confirmo que la información proporcionada es verídica y que he seguido las instrucciones
                  de preparación. Autorizo al equipo médico para realizar el procedimiento de colonoscopia.
                </p>
              </div>
            </label>
            {errores.consentimiento && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errores.consentimiento}
              </p>
            )}

            {errorServer && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{errorServer}</p>
              </div>
            )}
          </div>
        )}

        {/* ---- Navegación ---- */}
        <div className="flex gap-3 pt-2">
          {paso > 1 && (
            <button type="button" onClick={() => setPaso((p) => p - 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          )}

          {paso < 3 ? (
            <button type="button" onClick={siguiente}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-dark transition-colors">
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={enviando}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60">
              {enviando ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registrando...</>
              ) : (
                <><CheckCircle className="w-4 h-4" />Confirmar registro</>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
