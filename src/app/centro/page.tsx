import { redirect } from 'next/navigation'
import { getUsuario, createServerSupabaseClient } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { CentroDashboard } from './CentroDashboard'
import type { ProcCentro } from './CentroDashboard'

const DEMO: ProcCentro[] = [
  { id: '1', paciente: 'María García López',  cedula: '52.847.163', medico: 'Dr. Hernández',  fecha: '2026-03-18T08:30:00', producto: 'COLONLYTELY', estado: 'completado', prep: 'excelente' },
  { id: '2', paciente: 'Carlos Rodríguez P.', cedula: '80.213.456', medico: 'Dr. Hernández',  fecha: '2026-03-17T09:00:00', producto: 'COLONLYTELY', estado: 'completado', prep: 'buena' },
  { id: '3', paciente: 'Ana Torres Vega',     cedula: '43.217.890', medico: 'Dra. Martínez',  fecha: '2026-03-17T10:00:00', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'regular' },
  { id: '4', paciente: 'Jorge Mendoza C.',    cedula: '17.384.920', medico: 'Dra. Martínez',  fecha: '2026-03-16T09:00:00', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'inadecuada' },
  { id: '5', paciente: 'Patricia Sánchez R.', cedula: '65.432.178', medico: 'Dr. Hernández',  fecha: '2026-03-15T08:00:00', producto: 'NULYTELY',   estado: 'completado', prep: 'buena' },
  { id: '6', paciente: 'Roberto Jiménez L.',  cedula: '91.827.364', medico: 'Dr. Torres',     fecha: '2026-02-28T10:00:00', producto: 'COLONLYTELY', estado: 'completado', prep: 'buena' },
  { id: '7', paciente: 'Carmen Díaz Forero',  cedula: '28.374.619', medico: 'Dra. Martínez',  fecha: '2026-02-20T09:30:00', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'excelente' },
  { id: '8', paciente: 'Luis Alberto Cruz',   cedula: '74.829.301', medico: 'Dr. Torres',     fecha: '2026-02-15T11:00:00', producto: 'COLONLYTELY', estado: 'completado', prep: 'inadecuada' },
  { id: '9', paciente: 'Sofía Restrepo M.',   cedula: '33.192.478', medico: 'Dr. Hernández',  fecha: '2026-01-25T08:00:00', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'buena' },
  { id:'10', paciente: 'Felipe Castro V.',    cedula: '1.098.345',  medico: 'Dra. Martínez',  fecha: '2026-01-18T09:00:00', producto: 'NULYTELY',   estado: 'completado', prep: 'regular' },
]

export default async function CentroPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'usuario_centro' && usuario.rol !== 'admin') redirect('/login')

  let procedimientos: ProcCentro[] = DEMO
  const centroId = usuario.centro_id

  if (centroId) {
    try {
      const supabase = await createServerSupabaseClient()
      const { data } = await supabase
        .from('procedimientos')
        .select(`
          id, fecha, producto, estado, indicadores,
          pacientes(nombre, cedula),
          medico:usuarios!medico_id(nombre)
        `)
        .eq('centro_id', centroId)
        .order('fecha', { ascending: false })

      if (data && data.length > 0) {
        procedimientos = data.map((p) => {
          const pac = Array.isArray(p.pacientes) ? p.pacientes[0] : (p.pacientes as { nombre: string; cedula: string } | null)
          const med = Array.isArray(p.medico)    ? p.medico[0]    : (p.medico    as { nombre: string } | null)
          const ind = (p.indicadores ?? {}) as Record<string, string>
          return {
            id: p.id,
            paciente: pac?.nombre ?? '—',
            cedula:   pac?.cedula ?? '',
            medico:   med?.nombre ?? '—',
            fecha:    p.fecha,
            producto: p.producto,
            estado:   p.estado,
            prep:     ind.preparacion ?? '',
          }
        })
      }
    } catch { /* usa demo */ }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        subtitulo={usuario.centros?.nombre ?? 'Centro'}
        nombre={usuario.nombre}
        rol="Coordinador de Centro"
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-navy">Dashboard del Centro</h2>
          <p className="text-sm text-gray-500 mt-0.5">{usuario.centros?.nombre ?? 'Centro'}</p>
        </div>
        <CentroDashboard
          procedimientos={procedimientos}
          nombreCentro={usuario.centros?.nombre ?? 'Centro'}
        />
      </main>
    </div>
  )
}
