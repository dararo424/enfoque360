'use client'

import { useState } from 'react'
import { SidebarFase, type TabFase } from '@/components/SidebarFase'
import type { CentroPrograma, Visita, NovedadFase } from '@/lib/supabase'

type VisitaConPromotor = Visita & { visitador?: { nombre: string; email: string } | null }

interface Props {
  nombre: string
  centros: CentroPrograma[]
  visitas: VisitaConPromotor[]
  novedades: NovedadFase[]
}

export function GerenteShell({ nombre, centros, visitas, novedades }: Props) {
  const [tab, setTab] = useState<TabFase>('centros_activos')

  return (
    <div className="lg:flex bg-gray-50 min-h-screen">
      <SidebarFase
        tab={tab}
        onTab={setTab}
        nombre={nombre}
        rolLabel="Gerente"
        variante="gerente"
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-7xl mx-auto w-full">
        {tab === 'centros_activos' && (
          <SkeletonPanel titulo="Dashboard nacional" subtitulo="Vista consolidada · todos los visitadores">
            <p className="text-xs text-gray-500">
              Pendiente Bloque 3: gráficos pastel + barras + tabla consolidada.
              Centros: <strong>{centros.length}</strong> · Incluidos: <strong>{centros.filter(c => c.incluido_en_programa).length}</strong> · Visitas: <strong>{visitas.length}</strong>.
            </p>
          </SkeletonPanel>
        )}

        {tab === 'otros_centros' && (
          <SkeletonPanel titulo="Centros — vista consolidada" subtitulo="Todos los visitadores">
            <p className="text-xs text-gray-500">Pendiente Bloque 3: tabla consolidada + detalle + historial. Visitas totales: <strong>{visitas.length}</strong>.</p>
          </SkeletonPanel>
        )}

        {tab === 'novedades' && (
          <SkeletonPanel titulo="Novedades" subtitulo="Módulo nacional de novedades">
            <p className="text-xs text-gray-500">Pendiente Bloque 3: filtros, badges de nivel, alta de novedades. Total: <strong>{novedades.length}</strong>.</p>
          </SkeletonPanel>
        )}
      </main>
    </div>
  )
}

function SkeletonPanel({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children?: React.ReactNode }) {
  return (
    <section>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-navy">{titulo}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitulo}</p>
      </header>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 min-h-[200px]">
        {children ?? <p className="text-sm text-gray-400">Próximamente…</p>}
      </div>
    </section>
  )
}
