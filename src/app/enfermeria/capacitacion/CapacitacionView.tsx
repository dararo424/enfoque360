'use client'

import { useState } from 'react'
import { PlayCircle, BookOpen, ClipboardList, Award, CheckCircle2, Lock, ChevronRight } from 'lucide-react'

interface Modulo {
  id: string
  titulo: string
  descripcion: string
  duracion_min: number
  tipo: 'video' | 'lectura' | 'evaluacion'
  completado: boolean
  puntaje: number | null
  bloqueado: boolean
}

const MODULOS_DEMO: Modulo[] = [
  { id: '1', titulo: 'Introducción a COLONLYTELY',       descripcion: 'Mecanismo de acción, indicaciones y contraindicaciones',              duracion_min: 20, tipo: 'video',     completado: true,  puntaje: null, bloqueado: false },
  { id: '2', titulo: 'Protocolo de preparación',         descripcion: 'Pasos detallados para la preparación ideal del paciente',             duracion_min: 30, tipo: 'video',     completado: true,  puntaje: null, bloqueado: false },
  { id: '3', titulo: 'Escala de Boston: calificación',   descripcion: 'Cómo evaluar y registrar la calidad según la escala de Boston',      duracion_min: 25, tipo: 'lectura',   completado: false, puntaje: null, bloqueado: false },
  { id: '4', titulo: 'Manejo de efectos adversos',       descripcion: 'Identificación y manejo de reacciones durante la preparación',       duracion_min: 20, tipo: 'video',     completado: false, puntaje: null, bloqueado: true  },
  { id: '5', titulo: 'Evaluación final Módulo 1',        descripcion: 'Evaluación de conocimientos sobre preparación intestinal',           duracion_min: 15, tipo: 'evaluacion', completado: false, puntaje: null, bloqueado: true  },
]

const TIPO_ICON = {
  video:     <PlayCircle   className="w-5 h-5" />,
  lectura:   <BookOpen     className="w-5 h-5" />,
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
  { id: 5, pregunta: '¿Cuál es la náusea el efecto adverso más frecuente?', opciones: ['Sí', 'No, es la cefalea', 'No, es el mareo', 'No, es el dolor abdominal'], correcta: 0 },
]

export function CapacitacionView() {
  const [moduloActivo, setModuloActivo] = useState<string | null>(null)
  const [modulos, setModulos] = useState(MODULOS_DEMO)
  const [enEvaluacion, setEnEvaluacion] = useState(false)
  const [respuestas, setRespuestas] = useState<Record<number, number>>({})
  const [enviado, setEnviado] = useState(false)
  const [certificado, setCertificado] = useState(false)

  const completados  = modulos.filter((m) => m.completado).length
  const total        = modulos.length
  const pctProgreso  = Math.round((completados / total) * 100)
  const moduloObj    = modulos.find((m) => m.id === moduloActivo)

  function completarModulo(id: string) {
    setModulos((prev) =>
      prev.map((m, i) => {
        if (m.id === id) return { ...m, completado: true }
        // desbloquear siguiente
        if (prev[i - 1]?.id === id) return { ...m, bloqueado: false }
        return m
      })
    )
    setModuloActivo(null)
  }

  function calcularPuntaje() {
    let correctas = 0
    PREGUNTAS.forEach((p) => { if (respuestas[p.id] === p.correcta) correctas++ })
    return Math.round((correctas / PREGUNTAS.length) * 100)
  }

  function enviarEvaluacion() {
    const puntaje = calcularPuntaje()
    setEnviado(true)
    if (puntaje >= 80) {
      setModulos((prev) => prev.map((m) => m.tipo === 'evaluacion' ? { ...m, completado: true, puntaje } : m))
      if (puntaje >= 80) setCertificado(true)
    }
  }

  // Pantalla de certificado
  if (certificado) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-teal-light flex items-center justify-center mb-6">
          <Award className="w-12 h-12 text-teal" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">¡Felicitaciones!</h2>
        <p className="text-gray-500 mb-1">Has completado el programa de capacitación</p>
        <p className="text-sm text-gray-400 mb-8">Puntaje: {calcularPuntaje()}% · Módulo 1 · EMC Tecnoquímicas 2026</p>
        <div className="bg-white border-2 border-teal/30 rounded-2xl p-8 max-w-md w-full shadow-lg">
          <Award className="w-8 h-8 text-teal mx-auto mb-3" />
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Certificado de Finalización</p>
          <h3 className="text-lg font-bold text-navy">Preparación Intestinal · Módulo 1</h3>
          <p className="text-sm text-gray-500 mt-1">Programa EMC Tecnoquímicas · {new Date().getFullYear()}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-teal font-medium">Emitido el {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <button onClick={() => { setModuloActivo(null); setEnEvaluacion(false); setEnviado(false) }}
          className="mt-6 text-sm text-teal font-medium hover:underline">
          Volver al listado
        </button>
      </div>
    )
  }

  // Vista de evaluación
  if (enEvaluacion && moduloObj?.tipo === 'evaluacion') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy">{moduloObj.titulo}</h3>
          <button onClick={() => setEnEvaluacion(false)} className="text-xs text-gray-400 hover:text-gray-600">← Volver</button>
        </div>

        {!enviado ? (
          <div className="space-y-6">
            {PREGUNTAS.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="font-medium text-gray-900 mb-4">{p.id}. {p.pregunta}</p>
                <div className="space-y-2">
                  {p.opciones.map((op, i) => (
                    <button key={i} onClick={() => setRespuestas((r) => ({ ...r, [p.id]: i }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${
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
            <button
              onClick={enviarEvaluacion}
              disabled={Object.keys(respuestas).length < PREGUNTAS.length}
              className="w-full py-3 rounded-xl bg-teal text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-dark transition-colors">
              Enviar evaluación
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            {calcularPuntaje() >= 80 ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-navy mb-1">{calcularPuntaje()}%</p>
                <p className="text-gray-500">¡Aprobado! Obtienes tu certificado.</p>
                <button onClick={() => setCertificado(true)}
                  className="mt-6 px-6 py-2.5 bg-teal text-white rounded-xl font-semibold text-sm hover:bg-teal-dark transition-colors">
                  Ver certificado
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-red-500 mb-1">{calcularPuntaje()}%</p>
                <p className="text-gray-500 mb-2">No alcanzaste el mínimo (80%). Puedes intentarlo de nuevo.</p>
                <button onClick={() => { setRespuestas({}); setEnviado(false) }}
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

  // Vista de módulo activo (video/lectura)
  if (moduloActivo && moduloObj) {
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-sm max-w-none">
            <h4 className="text-navy font-semibold">Escala de Boston para preparación colónica</h4>
            <p className="text-gray-600">La Boston Bowel Preparation Scale (BBPS) es el estándar para evaluar la calidad de la preparación intestinal durante la colonoscopía.</p>
            <h5 className="text-navy font-medium mt-4">Segmentos evaluados</h5>
            <ul className="text-gray-600 space-y-1">
              <li><strong>Colon derecho:</strong> ciego y colon ascendente</li>
              <li><strong>Colon transverso:</strong> incluyendo flexuras</li>
              <li><strong>Colon izquierdo:</strong> colon descendente, sigma y recto</li>
            </ul>
            <h5 className="text-navy font-medium mt-4">Puntuación por segmento (0-3)</h5>
            <ul className="text-gray-600 space-y-1">
              <li><strong>0:</strong> Segmento no preparado, mucosa no visualizable</li>
              <li><strong>1:</strong> Porciones de mucosa visualizables, residuos que no se pueden limpiar</li>
              <li><strong>2:</strong> Mucosa visible, residuos limpios con irrigación</li>
              <li><strong>3:</strong> Mucosa completamente visible, sin residuos</li>
            </ul>
            <p className="text-gray-600 mt-4"><strong>Preparación adecuada:</strong> puntaje total ≥ 6 con ningún segmento &lt; 2.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-600 mb-4">
            {moduloObj.tipo === 'video'
              ? 'Una vez que hayas visto el video completo, marca el módulo como completado.'
              : 'Una vez que hayas revisado el contenido, márcalo como completado.'}
          </p>
          {moduloObj.tipo === 'evaluacion' ? (
            <button onClick={() => setEnEvaluacion(true)}
              className="w-full py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-colors">
              Iniciar evaluación
            </button>
          ) : (
            <button onClick={() => completarModulo(moduloActivo)}
              className="w-full py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-colors">
              Marcar como completado
            </button>
          )}
        </div>
      </div>
    )
  }

  // Vista listado de módulos
  return (
    <div className="space-y-6">
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
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pctProgreso}%` }} />
        </div>
        {completados === total && (
          <p className="text-xs text-teal font-medium mt-2">¡Programa completado! Ya puedes obtener tu certificado.</p>
        )}
      </div>

      {/* Lista de módulos */}
      <div className="space-y-3">
        {modulos.map((m) => (
          <button key={m.id} disabled={m.bloqueado}
            onClick={() => { setModuloActivo(m.id); setEnEvaluacion(m.tipo === 'evaluacion') }}
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
                 m.bloqueado  ? <Lock className="w-5 h-5" />        :
                                TIPO_ICON[m.tipo]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
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
