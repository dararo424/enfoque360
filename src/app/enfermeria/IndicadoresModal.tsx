'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Procedimiento } from '@/lib/supabase'

interface Props {
  procedimiento: Procedimiento
  onClose: () => void
  onGuardado: () => void
}

export function IndicadoresModal({ procedimiento, onClose, onGuardado }: Props) {
  const supabase = createClient()

  const indicadoresIniciales = procedimiento.indicadores as Record<string, string>

  const [campos, setCampos] = useState({
    preparacion: (indicadoresIniciales.preparacion as string) ?? '',
    escala_boston: (indicadoresIniciales.escala_boston as string) ?? '',
    polipos_encontrados: (indicadoresIniciales.polipos_encontrados as string) ?? '',
    tiempo_retirada: (indicadoresIniciales.tiempo_retirada as string) ?? '',
    ciecal_alcanzado: (indicadoresIniciales.ciecal_alcanzado as string) ?? '',
    complicaciones: (indicadoresIniciales.complicaciones as string) ?? '',
  })
  const [estado, setEstado] = useState(procedimiento.estado)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('procedimientos')
      .update({
        indicadores: campos as Record<string, unknown>,
        estado,
      } as never)
      .eq('id', procedimiento.id)

    if (updateError) {
      setError(updateError.message)
      setGuardando(false)
      return
    }

    onGuardado()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-navy">Registrar Indicadores</h2>
            <p className="text-sm text-gray-500">{procedimiento.pacientes?.nombre}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGuardar} className="px-6 py-5 space-y-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado del procedimiento</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as Procedimiento['estado'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="programado">Programado</option>
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Calidad de preparación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calidad de preparación
            </label>
            <select
              value={campos.preparacion}
              onChange={(e) => setCampos({ ...campos, preparacion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="">Seleccionar...</option>
              <option value="excelente">Excelente</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular (adecuada)</option>
              <option value="inadecuada">Inadecuada</option>
            </select>
          </div>

          {/* Escala Boston */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Escala Boston (0–9)
            </label>
            <input
              type="number"
              min={0}
              max={9}
              value={campos.escala_boston}
              onChange={(e) => setCampos({ ...campos, escala_boston: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="0"
            />
          </div>

          {/* Dos columnas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pólipos encontrados</label>
              <input
                type="number"
                min={0}
                value={campos.polipos_encontrados}
                onChange={(e) => setCampos({ ...campos, polipos_encontrados: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo retirada (min)</label>
              <input
                type="number"
                min={0}
                value={campos.tiempo_retirada}
                onChange={(e) => setCampos({ ...campos, tiempo_retirada: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="0"
              />
            </div>
          </div>

          {/* Ciecal alcanzado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciego alcanzado</label>
            <div className="flex gap-4">
              {['Sí', 'No'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="ciecal"
                    value={opt}
                    checked={campos.ciecal_alcanzado === opt}
                    onChange={() => setCampos({ ...campos, ciecal_alcanzado: opt })}
                    className="accent-teal"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Complicaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complicaciones / Notas</label>
            <textarea
              rows={3}
              value={campos.complicaciones}
              onChange={(e) => setCampos({ ...campos, complicaciones: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
              placeholder="Ninguna..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-2.5 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar indicadores'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
