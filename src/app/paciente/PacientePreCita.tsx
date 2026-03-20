'use client'

import { useState, useTransition } from 'react'
import { Bell, Heart, CheckCircle2, Upload, X, Clock, AlertTriangle, Sparkles } from 'lucide-react'
import { confirmarProtocolo } from '@/lib/actions'

// ---- Tipos ----
interface Props {
  fechaProcedimiento: string   // ISO string
  protocolo: { confirmado: boolean; archivoUrl?: string | null }
  procedimientoId: string
}

// ---- Mensajes de apoyo según días restantes ----
const MENSAJES: Record<string, { titulo: string; cuerpo: string; color: string }> = {
  mas7: {
    titulo: 'Tienes tiempo, ¡prepárate con calma!',
    cuerpo: 'Tu colonoscopia se acerca. Aprovecha estos días para leer las instrucciones, consultar dudas con tu médico y organizar tu dieta de preparación.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  entre3y7: {
    titulo: '¡Ya casi es momento!',
    cuerpo: 'En pocos días será tu procedimiento. Es el momento ideal para comprar el producto de preparación, confirmar tu cita y avisar a quien te acompañará.',
    color: 'bg-teal/10 border-teal/30 text-teal',
  },
  entre1y3: {
    titulo: 'Tu bienestar está primero',
    cuerpo: 'Recuerda: estás haciendo algo muy importante para tu salud. Sigue el protocolo con cuidado, hidrátate bien y descansa. El equipo médico está para ayudarte.',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  hoy: {
    titulo: '¡Hoy es el gran día!',
    cuerpo: 'Has completado tu preparación. Llega con tiempo, trae tu documento de identidad y recuerda no ingerir nada sólido. El equipo te acompañará en cada paso.',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
}

// ---- Recordatorios por etapa ----
interface Recordatorio { horas: number; titulo: string; descripcion: string; tipo: 'dieta' | 'producto' | 'ayuno' | 'cita' }
const RECORDATORIOS: Recordatorio[] = [
  { horas: 72, titulo: 'Iniciar dieta baja en residuos',  descripcion: 'Evitar semillas, granos, verduras de hoja, carnes rojas y lácteos.',           tipo: 'dieta'    },
  { horas: 24, titulo: 'Solo líquidos claros',            descripcion: 'Agua, caldo sin grasa, gelatina sin color, jugos sin pulpa.',                    tipo: 'dieta'    },
  { horas: 18, titulo: 'Tomar la primera dosis del producto', descripcion: 'Sigue exactamente las instrucciones del médico. Mantente cerca del baño.',   tipo: 'producto' },
  { horas: 8,  titulo: 'Tomar la segunda dosis (si aplica)', descripcion: 'Confirma con tu médico si necesitas una segunda dosis nocturna.',              tipo: 'producto' },
  { horas: 4,  titulo: 'Ayuno absoluto',                  descripcion: 'No ingerir nada, ni agua. Este punto es crítico para el procedimiento.',         tipo: 'ayuno'    },
  { horas: 0,  titulo: 'Llegada al centro médico',        descripcion: 'Llega 30 min antes. Trae tu documento y acompañante. No uses joyería.',          tipo: 'cita'     },
]

const TIPO_COLOR: Record<string, string> = {
  dieta:    'bg-blue-100 text-blue-700',
  producto: 'bg-teal/15 text-teal',
  ayuno:    'bg-orange-100 text-orange-700',
  cita:     'bg-navy/10 text-navy',
}
const TIPO_ICON: Record<string, string> = {
  dieta: '🥗', producto: '💊', ayuno: '🚫', cita: '🏥',
}

export function PacientePreCita({ fechaProcedimiento, protocolo, procedimientoId }: Props) {
  const [confirmado, setConfirmado] = useState(protocolo.confirmado)
  const [archivo, setArchivo]       = useState<File | null>(null)
  const [archivoUrl, setArchivoUrl] = useState<string | null>(protocolo.archivoUrl ?? null)
  const [isPending, startTransition] = useTransition()
  const [exito, setExito]           = useState(false)

  const ahora      = new Date()
  const proc       = new Date(fechaProcedimiento)
  const msRestante = proc.getTime() - ahora.getTime()
  const diasRest   = Math.ceil(msRestante / 86400000)
  const horasRest  = Math.ceil(msRestante / 3600000)

  const mensajeKey = diasRest > 7 ? 'mas7' : diasRest >= 3 ? 'entre3y7' : diasRest >= 1 ? 'entre1y3' : 'hoy'
  const msg = MENSAJES[mensajeKey]

  const recordatoriosActivos = RECORDATORIOS.map((r) => ({
    ...r,
    estado: horasRest > r.horas + 4
      ? 'futuro'
      : horasRest > r.horas
        ? 'proximo'
        : 'hecho',
  }))

  function handleArchivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setArchivo(f)
    setArchivoUrl(URL.createObjectURL(f))
  }

  function handleConfirmar() {
    startTransition(async () => {
      await confirmarProtocolo(procedimientoId)
      setConfirmado(true)
      setExito(true)
      setTimeout(() => setExito(false), 3000)
    })
  }

  const fechaLabel = proc.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4 mb-8">
      {/* Countdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-start gap-4">
          <div className="bg-navy rounded-2xl p-3 flex-shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Próximo procedimiento</p>
            <p className="text-base font-bold text-navy mt-0.5 capitalize">{fechaLabel}</p>
            <div className="flex items-center gap-3 mt-2">
              {diasRest > 0 ? (
                <>
                  <div className="bg-teal/10 rounded-xl px-3 py-1.5 text-center">
                    <p className="text-2xl font-bold text-teal leading-none">{diasRest}</p>
                    <p className="text-xs text-teal/70 mt-0.5">días</p>
                  </div>
                  <div className="bg-navy/5 rounded-xl px-3 py-1.5 text-center">
                    <p className="text-2xl font-bold text-navy leading-none">{proc.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-gray-400 mt-0.5">hora</p>
                  </div>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" /> Hoy es el día
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de apoyo */}
      <div className={`rounded-2xl border p-5 ${msg.color}`}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">{msg.titulo}</p>
            <p className="text-sm mt-1 leading-relaxed opacity-90">{msg.cuerpo}</p>
          </div>
        </div>
      </div>

      {/* Recordatorios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-navy">Cronograma de preparación</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recordatoriosActivos.map((r, i) => (
            <div key={i} className={`flex items-start gap-4 px-5 py-3.5 transition-colors ${
              r.estado === 'hecho'   ? 'opacity-40' :
              r.estado === 'proximo' ? 'bg-teal/5'  : ''
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {r.estado === 'hecho' ? (
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  </div>
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-base ${TIPO_COLOR[r.tipo]}`}>
                    {TIPO_ICON[r.tipo]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${r.estado === 'proximo' ? 'text-teal' : 'text-gray-800'}`}>{r.titulo}</p>
                  {r.estado === 'proximo' && (
                    <span className="text-xs font-semibold bg-teal text-white px-2 py-0.5 rounded-full">Ahora</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{r.descripcion}</p>
              </div>
              <span className="text-xs text-gray-300 flex-shrink-0 mt-1">
                {r.horas === 0 ? 'Día del proc.' : `−${r.horas}h`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmar protocolo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-start gap-3 mb-4">
          <Heart className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-navy">Confirmación de protocolo</h3>
            <p className="text-xs text-gray-400 mt-0.5">Confirma que recibiste y leíste las instrucciones de preparación</p>
          </div>
        </div>

        {confirmado ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Protocolo confirmado — el equipo médico fue notificado
          </div>
        ) : (
          <div className="space-y-4">
            {/* Alerta si falta poco */}
            {diasRest <= 3 && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">Confirma tu protocolo antes del procedimiento para que el equipo de enfermería esté preparado.</p>
              </div>
            )}

            {/* Subir foto del protocolo */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Foto del protocolo recibido <span className="text-gray-300">(opcional)</span></p>
              {archivoUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={archivoUrl} alt="Protocolo" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
                  <button onClick={() => { setArchivo(null); setArchivoUrl(null) }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-teal/40 transition-colors w-fit">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Subir foto del protocolo</span>
                  <input type="file" accept="image/*" onChange={handleArchivoChange} className="sr-only" />
                </label>
              )}
            </div>

            <button onClick={handleConfirmar} disabled={isPending}
              className="flex items-center gap-2 bg-teal text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal/90 disabled:opacity-60 transition-colors">
              {isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirmando...</>
                : <><CheckCircle2 className="w-4 h-4" /> Confirmar que recibí el protocolo</>
              }
            </button>

            {exito && (
              <p className="text-xs text-green-600 font-medium">✓ Confirmado exitosamente</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
