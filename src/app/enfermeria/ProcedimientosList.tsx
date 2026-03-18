'use client'

import { useState } from 'react'
import { ClipboardList, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import type { Procedimiento } from '@/lib/supabase'
import { IndicadoresModal } from './IndicadoresModal'

interface Props {
  procedimientos: Procedimiento[]
}

const ESTADO_CONFIG = {
  programado: {
    label: 'Programado',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: Clock,
  },
  en_curso: {
    label: 'En curso',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    icon: AlertCircle,
  },
  completado: {
    label: 'Completado',
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: CheckCircle,
  },
  cancelado: {
    label: 'Cancelado',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    icon: ClipboardList,
  },
}

export function ProcedimientosList({ procedimientos: inicial }: Props) {
  const [procedimientos, setProcedimientos] = useState(inicial)
  const [seleccionado, setSeleccionado] = useState<Procedimiento | null>(null)

  // Recargar la página al guardar (Server Component re-renders)
  function handleGuardado() {
    // En un prototipo esto recarga la lista optimistamente
    // En producción usaríamos revalidatePath o router.refresh()
    window.location.reload()
  }

  if (procedimientos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No hay procedimientos programados para hoy</p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {procedimientos.map((proc) => {
          const config = ESTADO_CONFIG[proc.estado]
          const Icon = config.icon
          const hora = new Date(proc.fecha).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div
              key={proc.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => setSeleccionado(proc)}
            >
              {/* Hora */}
              <div className="text-sm text-gray-500 w-12 shrink-0 font-mono">{hora}</div>

              {/* Info paciente */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {proc.pacientes?.nombre ?? '—'}
                </p>
                <p className="text-xs text-gray-500">
                  {proc.pacientes?.cedula ?? ''} · {proc.producto}
                </p>
              </div>

              {/* Estado badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
              </span>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {seleccionado && (
        <IndicadoresModal
          procedimiento={seleccionado}
          onClose={() => setSeleccionado(null)}
          onGuardado={handleGuardado}
        />
      )}
    </>
  )
}
