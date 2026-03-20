'use client'

import { useState } from 'react'
import { AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react'

interface Novedad {
  id: string
  tipo: 'calidad' | 'reproceso' | 'capacitacion' | 'insumos' | 'otro'
  nivel: 'alto' | 'medio' | 'bajo'
  titulo: string
  descripcion: string
  centro: string
  responsable: string
  sla_dias: number
  estado: 'abierta' | 'en_gestion' | 'cerrada'
  created_at: string
}

const DEMO: Novedad[] = [
  { id: '1', tipo: 'reproceso',    nivel: 'alto',  titulo: 'Alto % reprocesos Clínica Santa Fe',         descripcion: 'El índice de reprocesos superó el 20% en la última semana. Requiere intervención inmediata.', centro: 'Clínica Santa Fe', responsable: 'Dr. Hernández', sla_dias: 3,  estado: 'abierta',     created_at: '2026-03-18' },
  { id: '2', tipo: 'capacitacion', nivel: 'medio', titulo: 'Módulo evaluación pendiente Hospital San Vicente', descripcion: '3 enfermeras no han completado el módulo de evaluación del período.', centro: 'Hospital San Vicente', responsable: 'Enf. María Torres', sla_dias: 7,  estado: 'en_gestion',  created_at: '2026-03-15' },
  { id: '3', tipo: 'insumos',      nivel: 'medio', titulo: 'Stock bajo TRAVAD PIK Bucaramanga',           descripcion: 'Inventario por debajo del mínimo recomendado para próximas 2 semanas.', centro: 'Fundación Cardiovascular', responsable: 'Logística', sla_dias: 5,  estado: 'en_gestion',  created_at: '2026-03-14' },
  { id: '4', tipo: 'calidad',      nivel: 'bajo',  titulo: 'Mejora sostenida Clínica Medellín',           descripcion: 'El centro ha mantenido >85% prep adecuada por 3 meses consecutivos.', centro: 'Clínica Medellín', responsable: 'TQ Nacional', sla_dias: 30, estado: 'cerrada',     created_at: '2026-03-10' },
  { id: '5', tipo: 'reproceso',    nivel: 'alto',  titulo: 'Reproceso Centro Médico Imbanaco',            descripcion: 'Segundo trimestre con reprocesos >20%. Revisar protocolo de preparación.', centro: 'Centro Médico Imbanaco', responsable: 'Dra. Martínez', sla_dias: 3, estado: 'abierta', created_at: '2026-03-12' },
]

const TIPO_LABEL: Record<Novedad['tipo'], string> = {
  calidad: 'Calidad', reproceso: 'Reproceso', capacitacion: 'Capacitación', insumos: 'Insumos', otro: 'Otro',
}
const TIPO_COLOR: Record<Novedad['tipo'], string> = {
  calidad: 'bg-blue-50 text-blue-700', reproceso: 'bg-red-50 text-red-700',
  capacitacion: 'bg-purple-50 text-purple-700', insumos: 'bg-yellow-50 text-yellow-700', otro: 'bg-gray-100 text-gray-600',
}
const NIVEL_ICON = {
  alto:  <AlertTriangle className="w-4 h-4 text-red-500" />,
  medio: <Info          className="w-4 h-4 text-yellow-500" />,
  bajo:  <CheckCircle2  className="w-4 h-4 text-green-500" />,
}
const ESTADO_COLOR: Record<Novedad['estado'], string> = {
  abierta:    'bg-red-50 text-red-700',
  en_gestion: 'bg-yellow-50 text-yellow-700',
  cerrada:    'bg-green-50 text-green-700',
}
const ESTADO_LABEL: Record<Novedad['estado'], string> = {
  abierta: 'Abierta', en_gestion: 'En gestión', cerrada: 'Cerrada',
}

export function TQNovedades() {
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroNivel,  setFiltroNivel]  = useState<string>('')

  const filtradas = DEMO.filter((n) =>
    (!filtroEstado || n.estado === filtroEstado) &&
    (!filtroNivel  || n.nivel  === filtroNivel)
  )

  const abiertas    = DEMO.filter((n) => n.estado === 'abierta').length
  const en_gestion  = DEMO.filter((n) => n.estado === 'en_gestion').length
  const altas       = DEMO.filter((n) => n.nivel  === 'alto').length

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-red-600">{abiertas}</p>
          <p className="text-sm text-gray-600 mt-1">Novedades abiertas</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-yellow-600">{en_gestion}</p>
          <p className="text-sm text-gray-600 mt-1">En gestión</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-orange-600">{altas}</p>
          <p className="text-sm text-gray-600 mt-1">Nivel alto</p>
        </div>
      </div>

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

      {/* Tabla */}
      <div className="space-y-3">
        {filtradas.map((n) => {
          const diasTranscurridos = Math.floor((new Date().getTime() - new Date(n.created_at).getTime()) / 86400000)
          const vencida = n.estado !== 'cerrada' && diasTranscurridos > n.sla_dias
          return (
            <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${vencida ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{NIVEL_ICON[n.nivel]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLOR[n.tipo]}`}>{TIPO_LABEL[n.tipo]}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[n.estado]}`}>{ESTADO_LABEL[n.estado]}</span>
                    {vencida && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Vencida</span>}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{n.titulo}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{n.descripcion}</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-xs text-gray-400">Centro: <span className="text-gray-600">{n.centro}</span></span>
                    <span className="text-xs text-gray-400">Responsable: <span className="text-gray-600">{n.responsable}</span></span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      SLA: {n.sla_dias}d · {diasTranscurridos}d transcurridos
                    </span>
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
