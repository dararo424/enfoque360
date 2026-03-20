'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react'
import { actualizarEstadoNovedad } from '@/lib/actions'

export interface Novedad {
  id: string
  tipo: string
  nivel: string
  titulo: string
  descripcion: string
  centro: string
  responsable: string
  sla_dias: number
  estado: string
  created_at: string
}

// Demo para cuando no hay datos en Supabase
const DEMO: Novedad[] = [
  { id: 'd1', tipo: 'reproceso',    nivel: 'alto',  titulo: 'Alto % reprocesos Clínica Santa Fe',              descripcion: 'El índice de reprocesos superó el 20% en los últimos 30 días.',         centro: 'Clínica Santa Fe',          responsable: 'TQ Nacional',       sla_dias: 3,  estado: 'abierta',    created_at: '2026-03-18' },
  { id: 'd2', tipo: 'capacitacion', nivel: 'medio', titulo: 'Módulo evaluación pendiente Hospital San Vicente', descripcion: '3 enfermeras no han completado el módulo de evaluación del período.',  centro: 'Hospital San Vicente',      responsable: 'Enf. Torres',       sla_dias: 7,  estado: 'en_gestion', created_at: '2026-03-15' },
  { id: 'd3', tipo: 'insumos',      nivel: 'medio', titulo: 'Stock bajo TRAVAD PIK Bucaramanga',                descripcion: 'Inventario por debajo del mínimo recomendado.',                        centro: 'Fundación Cardiovascular',  responsable: 'Logística',         sla_dias: 5,  estado: 'en_gestion', created_at: '2026-03-14' },
  { id: 'd4', tipo: 'calidad',      nivel: 'bajo',  titulo: 'Mejora sostenida Clínica Medellín',               descripcion: 'El centro ha mantenido >85% prep adecuada por 3 meses consecutivos.', centro: 'Clínica Medellín',          responsable: 'TQ Nacional',       sla_dias: 30, estado: 'cerrada',    created_at: '2026-03-10' },
  { id: 'd5', tipo: 'reproceso',    nivel: 'alto',  titulo: 'Reproceso Centro Médico Imbanaco',                descripcion: 'Segundo trimestre con reprocesos >20%. Revisar protocolo.',            centro: 'Centro Médico Imbanaco',    responsable: 'Dra. Martínez',     sla_dias: 3,  estado: 'abierta',    created_at: '2026-03-12' },
]

const TIPO_LABEL: Record<string, string> = { calidad: 'Calidad', reproceso: 'Reproceso', capacitacion: 'Capacitación', insumos: 'Insumos', otro: 'Otro' }
const TIPO_COLOR: Record<string, string> = {
  calidad: 'bg-blue-50 text-blue-700', reproceso: 'bg-red-50 text-red-700',
  capacitacion: 'bg-purple-50 text-purple-700', insumos: 'bg-yellow-50 text-yellow-700', otro: 'bg-gray-100 text-gray-600',
}
const NIVEL_ICON: Record<string, React.ReactNode> = {
  alto:  <AlertTriangle className="w-4 h-4 text-red-500" />,
  medio: <Info          className="w-4 h-4 text-yellow-500" />,
  bajo:  <CheckCircle2  className="w-4 h-4 text-green-500" />,
}
const ESTADO_COLOR: Record<string, string> = { abierta: 'bg-red-50 text-red-700', en_gestion: 'bg-yellow-50 text-yellow-700', cerrada: 'bg-green-50 text-green-700' }
const ESTADO_LABEL: Record<string, string> = { abierta: 'Abierta', en_gestion: 'En gestión', cerrada: 'Cerrada' }
const SIGUIENTE_ESTADO: Record<string, 'en_gestion' | 'cerrada'> = { abierta: 'en_gestion', en_gestion: 'cerrada' }
const ACCION_LABEL: Record<string, string> = { abierta: 'Tomar gestión', en_gestion: 'Cerrar' }

export function TQNovedades({ novedadesIniciales }: { novedadesIniciales: Novedad[] }) {
  const usandoDemo = novedadesIniciales.length === 0
  const [novedades, setNovedades] = useState(usandoDemo ? DEMO : novedadesIniciales)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroNivel,  setFiltroNivel]  = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const filtradas = novedades.filter((n) =>
    (!filtroEstado || n.estado === filtroEstado) &&
    (!filtroNivel  || n.nivel  === filtroNivel)
  )

  const abiertas   = novedades.filter((n) => n.estado === 'abierta').length
  const enGestion  = novedades.filter((n) => n.estado === 'en_gestion').length
  const altas      = novedades.filter((n) => n.nivel  === 'alto').length

  function avanzarEstado(novedad: Novedad) {
    const siguiente = SIGUIENTE_ESTADO[novedad.estado]
    if (!siguiente) return

    // Optimista
    setNovedades((prev) => prev.map((n) => n.id === novedad.id ? { ...n, estado: siguiente } : n))

    if (usandoDemo || novedad.id.startsWith('d')) return // no persiste demo

    startTransition(async () => {
      try {
        await actualizarEstadoNovedad(novedad.id, siguiente)
        router.refresh()
      } catch {
        // Revertir
        setNovedades((prev) => prev.map((n) => n.id === novedad.id ? { ...n, estado: novedad.estado } : n))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-red-600">{abiertas}</p>
          <p className="text-sm text-gray-600 mt-1">Novedades abiertas</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-yellow-600">{enGestion}</p>
          <p className="text-sm text-gray-600 mt-1">En gestión</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-orange-600">{altas}</p>
          <p className="text-sm text-gray-600 mt-1">Nivel alto</p>
        </div>
      </div>

      {usandoDemo && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Mostrando datos demo — las novedades reales se generan automáticamente al completar procedimientos en Supabase.
        </p>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex gap-4 flex-wrap items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Estado</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            <option value="">Todos</option>
            <option value="abierta">Abierta</option>
            <option value="en_gestion">En gestión</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Nivel</label>
          <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white">
            <option value="">Todos</option>
            <option value="alto">Alto</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtradas.map((n) => {
          const diasTranscurridos = Math.floor((new Date().getTime() - new Date(n.created_at).getTime()) / 86400000)
          const vencida = n.estado !== 'cerrada' && diasTranscurridos > n.sla_dias
          const puedeAvanzar = n.estado !== 'cerrada'
          return (
            <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${vencida ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{NIVEL_ICON[n.nivel] ?? NIVEL_ICON.medio}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLOR[n.tipo] ?? TIPO_COLOR.otro}`}>{TIPO_LABEL[n.tipo] ?? n.tipo}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[n.estado] ?? ''}`}>{ESTADO_LABEL[n.estado] ?? n.estado}</span>
                    {vencida && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Vencida</span>}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{n.titulo}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{n.descripcion}</p>
                  <div className="flex flex-wrap gap-4 mt-2 items-center">
                    <span className="text-xs text-gray-400">Centro: <span className="text-gray-600">{n.centro}</span></span>
                    <span className="text-xs text-gray-400">Responsable: <span className="text-gray-600">{n.responsable}</span></span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      SLA {n.sla_dias}d · {diasTranscurridos}d transcurridos
                    </span>
                    {puedeAvanzar && (
                      <button onClick={() => avanzarEstado(n)} disabled={pending}
                        className="ml-auto text-xs font-semibold text-teal hover:text-teal-dark transition-colors disabled:opacity-40">
                        {ACCION_LABEL[n.estado]} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {filtradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-xs text-gray-400">
            Sin novedades con los filtros seleccionados
          </div>
        )}
      </div>
    </div>
  )
}
