'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlayCircle, BookOpen, ClipboardList, Award, CheckCircle2, Lock, ChevronRight, AlertTriangle } from 'lucide-react'
import { marcarModuloCompletado } from '@/lib/actions'
import type { ModuloConProgreso, EstadoCertificacion } from '@/lib/actions'

// ---- Demo fallback cuando Supabase no tiene módulos ----
const MODULOS_DEMO: ModuloConProgreso[] = [
  { id: 'demo-1', titulo: 'Introducción a COLONLYTELY',     descripcion: 'Mecanismo de acción, indicaciones y contraindicaciones',         duracion_min: 20, tipo: 'video',     orden: 1, completado: false, puntaje: null, bloqueado: false },
  { id: 'demo-2', titulo: 'Protocolo de preparación',       descripcion: 'Pasos detallados para la preparación ideal del paciente',        duracion_min: 30, tipo: 'video',     orden: 2, completado: false, puntaje: null, bloqueado: true  },
  { id: 'demo-3', titulo: 'Escala de Boston: calificación', descripcion: 'Cómo evaluar y registrar la calidad según la escala de Boston', duracion_min: 25, tipo: 'lectura',   orden: 3, completado: false, puntaje: null, bloqueado: true  },
  { id: 'demo-4', titulo: 'Manejo de efectos adversos',     descripcion: 'Identificación y manejo de reacciones durante la preparación',  duracion_min: 20, tipo: 'video',     orden: 4, completado: false, puntaje: null, bloqueado: true  },
  { id: 'demo-5', titulo: 'Evaluación final Módulo 1',      descripcion: 'Evaluación de conocimientos sobre preparación intestinal',      duracion_min: 15, tipo: 'evaluacion', orden: 5, completado: false, puntaje: null, bloqueado: true  },
]

const esDemo = (id: string) => id.startsWith('demo-')

const TIPO_ICON = {
  video:     <PlayCircle    className="w-5 h-5" />,
  lectura:   <BookOpen      className="w-5 h-5" />,
  evaluacion: <ClipboardList className="w-5 h-5" />,
}
const TIPO_LABEL = { video: 'Video', lectura: 'Lectura', evaluacion: 'Evaluación' }
const TIPO_COLOR = {
  video:     'bg-blue-50 text-blue-600',
  lectura:   'bg-purple-50 text-purple-600',
  evaluacion: 'bg-orange-50 text-orange-600',
}

const PREGUNTAS = [
  { id: 1, pregunta: '¿Cuántas horas de ayuno sólido se recomiendan antes de la colonoscopía?', opciones: ['4 horas', '6 horas', '8 horas', '12 horas'], correcta: 2 },
  { id: 2, pregunta: 'La escala de Boston clasifica la preparación en cuántos segmentos:', opciones: ['2', '3', '4', '5'], correcta: 1 },
  { id: 3, pregunta: '¿Qué puntaje de la escala de Boston indica preparación adecuada?', opciones: ['≥ 3', '≥ 5', '≥ 6', '= 9'], correcta: 2 },
  { id: 4, pregunta: 'El COLONLYTELY debe consumirse preferentemente:', opciones: ['Con el estómago lleno', 'En ayunas total', 'Vía oral fraccionado', 'En bolo único'], correcta: 2 },
  { id: 5, pregunta: '¿La náusea es el efecto adverso más frecuente?', opciones: ['Sí', 'No, es la cefalea', 'No, es el mareo', 'No, es el dolor abdominal'], correcta: 0 },
]

interface Props {
  modulosIniciales: ModuloConProgreso[]
  estadoCert?: EstadoCertificacion
}

export function CapacitacionView({ modulosIniciales, estadoCert }: Props) {
  const inicial = modulosIniciales.length > 0 ? modulosIniciales : MODULOS_DEMO
  const [modulos, setModulos] = useState(inicial)
  const [moduloActivo, setModuloActivo] = useState<string | null>(null)
  const [enEvaluacion, setEnEvaluacion] = useState(false)
  const [respuestas, setRespuestas] = useState<Record<number, number>>({})
  const [enviado, setEnviado] = useState(false)
  const [puntajeFinal, setPuntajeFinal] = useState<number | null>(null)
  const [saving, startTransition] = useTransition()
  const router = useRouter()

  const completados = modulos.filter((m) => m.completado).length
  const total       = modulos.length
  const pctProgreso = Math.round((completados / total) * 100)
  const moduloObj   = modulos.find((m) => m.id === moduloActivo)
  const todosCompletos = completados === total

  function desbloquearSiguiente(idCompletado: string) {
    setModulos((prev) => {
      const idx = prev.findIndex((m) => m.id === idCompletado)
      return prev.map((m, i) => {
        if (m.id === idCompletado) return { ...m, completado: true }
        if (i === idx + 1)        return { ...m, bloqueado: false }
        return m
      })
    })
  }

  function completarModulo(id: string, puntaje?: number) {
    desbloquearSiguiente(id)
    setModuloActivo(null)
    setEnEvaluacion(false)
    setRespuestas({})
    setEnviado(false)

    if (esDemo(id)) return // no persiste datos demo

    startTransition(async () => {
      try {
        await marcarModuloCompletado(id, puntaje)
        router.refresh()
      } catch { /* silencioso */ }
    })
  }

  function calcularPuntaje() {
    let correctas = 0
    PREGUNTAS.forEach((p) => { if (respuestas[p.id] === p.correcta) correctas++ })
    return Math.round((correctas / PREGUNTAS.length) * 100)
  }

  function enviarEvaluacion() {
    const puntaje = calcularPuntaje()
    setPuntajeFinal(puntaje)
    setEnviado(true)
    if (puntaje >= 80 && moduloActivo) {
      completarModulo(moduloActivo, puntaje)
    }
  }

  // ---- Pantalla certificado ----
  if (todosCompletos && !moduloActivo) {
    const mejorPuntaje = modulos.find((m) => m.tipo === 'evaluacion')?.puntaje
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-teal-light flex items-center justify-center mb-6">
          <Award className="w-12 h-12 text-teal" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">¡Felicitaciones!</h2>
        <p className="text-gray-500 mb-1">Has completado el programa de capacitación</p>
        {mejorPuntaje && <p className="text-sm text-gray-400 mb-8">Puntaje: {mejorPuntaje}% · Módulo 1 · EMC Tecnoquímicas 2026</p>}
        <div className="bg-white border-2 border-teal/30 rounded-2xl p-8 max-w-md w-full shadow-lg">
          <Award className="w-8 h-8 text-teal mx-auto mb-3" />
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Certificado de Finalización</p>
          <h3 className="text-lg font-bold text-navy">Preparación Intestinal · Módulo 1</h3>
          <p className="text-sm text-gray-500 mt-1">Programa EMC Tecnoquímicas · {new Date().getFullYear()}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-teal font-medium">
              Emitido el {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ---- Evaluación ----
  if (enEvaluacion && moduloObj?.tipo === 'evaluacion') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy">{moduloObj.titulo}</h3>
          <button onClick={() => { setEnEvaluacion(false); setRespuestas({}); setEnviado(false) }}
            className="text-xs text-gray-400 hover:text-gray-600">← Volver</button>
        </div>

        {!enviado ? (
          <div className="space-y-6">
            {PREGUNTAS.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="font-medium text-gray-900 mb-4">{p.id}. {p.pregunta}</p>
                <div className="space-y-2">
                  {p.opciones.map((op, i) => (
                    <button key={i} onClick={() => setRespuestas((r) => ({ ...r, [p.id]: i }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                        respuestas[p.id] === i
                          ? 'border-teal bg-teal-light text-teal font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={enviarEvaluacion}
              disabled={Object.keys(respuestas).length < PREGUNTAS.length}
              className="w-full py-3 rounded-xl bg-teal text-white font-semibold text-sm disabled:opacity-50 hover:bg-teal-dark transition-colors">
              Enviar evaluación
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            {(puntajeFinal ?? 0) >= 80 ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-navy mb-1">{puntajeFinal}%</p>
                <p className="text-gray-500">¡Aprobado! Tu progreso ha sido guardado.</p>
                {esDemo(moduloObj.id) && (
                  <p className="text-xs text-amber-600 mt-2">Modo demo — conecta Supabase para persistir el certificado.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-red-500 mb-1">{puntajeFinal}%</p>
                <p className="text-gray-500 mb-2">No alcanzaste el mínimo (80%). Puedes intentarlo de nuevo.</p>
                <button onClick={() => { setRespuestas({}); setEnviado(false); setPuntajeFinal(null) }}
                  className="mt-4 px-6 py-2.5 bg-teal text-white rounded-xl font-semibold text-sm hover:bg-teal-dark transition-colors">
                  Reintentar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // ---- Vista módulo activo (video / lectura) ----
  if (moduloActivo && moduloObj && moduloObj.tipo !== 'evaluacion') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy">{moduloObj.titulo}</h3>
          <button onClick={() => setModuloActivo(null)} className="text-xs text-gray-400 hover:text-gray-600">← Volver</button>
        </div>

        {moduloObj.tipo === 'video' && (
          <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center">
            <div className="text-center">
              <PlayCircle className="w-16 h-16 text-white/40 mx-auto mb-3" />
              <p className="text-white/60 text-sm">Reproductor de video · {moduloObj.duracion_min} min</p>
              <p className="text-white/40 text-xs mt-1">Contenido disponible en la plataforma EMC</p>
            </div>
          </div>
        )}

        {moduloObj.tipo === 'lectura' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4 text-sm text-gray-600">
            <h4 className="text-navy font-semibold text-base">Escala de Boston para preparación colónica</h4>
            <p>La Boston Bowel Preparation Scale (BBPS) es el estándar para evaluar la calidad de la preparación intestinal durante la colonoscopía.</p>
            <div>
              <h5 className="text-navy font-medium mb-2">Segmentos evaluados</h5>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Colon derecho:</strong> ciego y colon ascendente</li>
                <li><strong>Colon transverso:</strong> incluyendo flexuras</li>
                <li><strong>Colon izquierdo:</strong> colon descendente, sigma y recto</li>
              </ul>
            </div>
            <div>
              <h5 className="text-navy font-medium mb-2">Puntuación por segmento (0–3)</h5>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>0:</strong> Mucosa no visualizable</li>
                <li><strong>1:</strong> Porciones visibles, residuos que no se pueden limpiar</li>
                <li><strong>2:</strong> Mucosa visible, residuos limpiables con irrigación</li>
                <li><strong>3:</strong> Mucosa completamente visible, sin residuos</li>
              </ul>
            </div>
            <p className="bg-teal-light border border-teal/20 rounded-xl px-4 py-3 text-teal font-medium">
              Preparación adecuada: puntaje total ≥ 6 con ningún segmento &lt; 2
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {moduloObj.completado ? (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Módulo ya completado
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {moduloObj.tipo === 'video' ? 'Una vez visto el video completo, márcalo como completado.' : 'Una vez revisado el contenido, márcalo como completado.'}
              </p>
              <button onClick={() => completarModulo(moduloActivo)} disabled={saving}
                className="w-full py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-dark disabled:opacity-60 transition-colors">
                {saving ? 'Guardando...' : 'Marcar como completado'}
              </button>
              {esDemo(moduloObj.id) && (
                <p className="text-xs text-amber-600 mt-2 text-center">Modo demo — el progreso no se guardará en Supabase.</p>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ---- Listado de módulos ----
  return (
    <div className="space-y-6">

      {/* Banner estado certificación */}
      {estadoCert && (estadoCert.vigente || estadoCert.proximaAVencer || (estadoCert.diasRestantes !== null && estadoCert.diasRestantes <= 0)) && (
        <CertBanner cert={estadoCert} />
      )}

      {/* Progreso general */}
      <div className="bg-gradient-to-r from-teal/10 to-navy/5 rounded-2xl border border-teal/20 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-navy">Tu progreso</h3>
            <p className="text-sm text-gray-500">{completados} de {total} módulos completados</p>
          </div>
          <span className="text-2xl font-bold text-teal">{pctProgreso}%</span>
        </div>
        <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${pctProgreso}%` }} />
        </div>
        {modulos === MODULOS_DEMO && (
          <p className="text-xs text-amber-600 mt-2">
            Sin módulos en Supabase — ejecuta la migración 002 para cargar el contenido real.
          </p>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {modulos.map((m) => (
          <button key={m.id} disabled={m.bloqueado}
            onClick={() => {
              setModuloActivo(m.id)
              setEnEvaluacion(m.tipo === 'evaluacion')
              setRespuestas({})
              setEnviado(false)
              setPuntajeFinal(null)
            }}
            className={`w-full text-left bg-white rounded-2xl border shadow-sm p-5 transition-all ${
              m.bloqueado
                ? 'border-gray-100 opacity-50 cursor-not-allowed'
                : m.completado
                  ? 'border-green-100 hover:border-green-200'
                  : 'border-gray-100 hover:border-teal/30 hover:shadow-md'
            }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                m.completado ? 'bg-green-100 text-green-600' :
                m.bloqueado  ? 'bg-gray-100 text-gray-400'  :
                               TIPO_COLOR[m.tipo]
              }`}>
                {m.completado ? <CheckCircle2 className="w-5 h-5" /> :
                 m.bloqueado  ? <Lock          className="w-5 h-5" /> :
                                TIPO_ICON[m.tipo]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm">{m.titulo}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TIPO_COLOR[m.tipo]}`}>{TIPO_LABEL[m.tipo]}</span>
                </div>
                <p className="text-xs text-gray-400">{m.descripcion} · {m.duracion_min} min</p>
                {m.puntaje !== null && (
                  <p className="text-xs text-green-600 font-medium mt-1">Puntaje: {m.puntaje}%</p>
                )}
              </div>
              {!m.bloqueado && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- Banner de estado de certificación ----
function CertBanner({ cert }: { cert: EstadoCertificacion }) {
  const vencida       = (cert.diasRestantes ?? 1) <= 0
  const proximaAlta   = !vencida && (cert.diasRestantes ?? 99) <= 7
  const fechaVence    = cert.fechaVencimiento
    ? new Date(cert.fechaVencimiento).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  if (vencida) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">Certificación vencida</p>
          <p className="text-xs text-red-600 mt-0.5">
            Tu certificación venció hace {Math.abs(cert.diasRestantes ?? 0)} días{fechaVence ? ` (${fechaVence})` : ''}. Debes completar nuevamente la evaluación para renovarla.
          </p>
        </div>
      </div>
    )
  }

  if (proximaAlta) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-700">Certificación vence pronto</p>
          <p className="text-xs text-orange-600 mt-0.5">
            Tu certificación vence en <strong>{cert.diasRestantes} días</strong>{fechaVence ? ` (${fechaVence})` : ''}. Renueva la evaluación a tiempo.
          </p>
        </div>
      </div>
    )
  }

  // Próxima a vencer pero con tiempo (8–30 días)
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-yellow-700">Certificación vigente — próxima a vencer</p>
        <p className="text-xs text-yellow-700 mt-0.5">
          Vence el {fechaVence} ({cert.diasRestantes} días restantes). Planifica tu renovación.
        </p>
      </div>
    </div>
  )
}
