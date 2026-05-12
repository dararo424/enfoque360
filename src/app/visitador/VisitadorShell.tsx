'use client'

import { useState } from 'react'
import { SidebarFase, type TabFase } from '@/components/SidebarFase'
import type { CentroPrograma, Visita, NovedadFase } from '@/lib/supabase'

interface Props {
  nombre: string
  centros: CentroPrograma[]
  visitas: Visita[]
  novedades: NovedadFase[]
  esGerenteEnVistaVisitador?: boolean
}

export function VisitadorShell({ nombre, centros, visitas, novedades, esGerenteEnVistaVisitador }: Props) {
  const [tab, setTab] = useState<TabFase>('otros_centros')

  return (
    <div className="lg:flex bg-gray-50 min-h-screen">
      <SidebarFase
        tab={tab}
        onTab={setTab}
        nombre={nombre}
        rolLabel="Visitador"
        variante={esGerenteEnVistaVisitador ? 'gerente' : 'visitador'}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-7xl mx-auto w-full">
        {esGerenteEnVistaVisitador && (
          <div className="mb-4 text-xs px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            Estás viendo la perspectiva del visitador como gerente. Las acciones de “Iniciar/Finalizar visita” están deshabilitadas en este modo.
          </div>
        )}

        {tab === 'centros_activos' && <SkeletonPanel titulo="Centros activos" subtitulo="Mapa de Colombia con centros incluidos en el programa">
          <p className="text-xs text-gray-500">Pendiente Bloque 2: mapa react-simple-maps. Centros incluidos: <strong>{centros.filter(c => c.incluido_en_programa).length}</strong> de {centros.length}.</p>
        </SkeletonPanel>}

        {tab === 'otros_centros' && <SkeletonPanel titulo="Otros centros" subtitulo="Centros visitables — estado por visita">
          <p className="text-xs text-gray-500">Pendiente Bloque 2: tabla con semáforo + filtros. Visitas cargadas: <strong>{visitas.length}</strong>.</p>
        </SkeletonPanel>}

        {tab === 'novedades' && <SkeletonPanel titulo="Novedades" subtitulo="Reportar y consultar incidencias">
          <p className="text-xs text-gray-500">Novedades cargadas: <strong>{novedades.length}</strong>.</p>
        </SkeletonPanel>}
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
