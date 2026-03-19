import { redirect } from 'next/navigation'
import { createServerSupabaseClient, getUsuario } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { ProcedimientosDashboard } from './ProcedimientosDashboard'
import type { Procedimiento } from '@/lib/supabase'

// ---- Datos demo para presentación ----
export interface ProcRow {
  id: string
  hora: string
  paciente: string
  cedula: string
  medico: string
  producto: string
  preparacion: string | null
  estado: 'programado' | 'en_curso' | 'completado' | 'cancelado'
  indicadores: Record<string, string>
}

const DEMO: ProcRow[] = [
  { id: '1', hora: '07:30', paciente: 'María García López', cedula: '52.847.163', medico: 'Dr. Hernández', producto: 'COLONLYTELY', preparacion: 'excelente', estado: 'completado', indicadores: { intubacion_cecal: 'Sí', tiempo_retirada: '8', adenomas: '0' } },
  { id: '2', hora: '08:00', paciente: 'Carlos Rodríguez P.', cedula: '80.213.456', medico: 'Dr. Hernández', producto: 'COLONLYTELY', preparacion: 'buena', estado: 'completado', indicadores: { intubacion_cecal: 'Sí', tiempo_retirada: '10', adenomas: '1' } },
  { id: '3', hora: '08:30', paciente: 'Ana Torres Vega', cedula: '43.217.890', medico: 'Dra. Martínez', producto: 'TRAVAD PIK', preparacion: 'regular', estado: 'completado', indicadores: { intubacion_cecal: 'Sí', tiempo_retirada: '9', adenomas: '0' } },
  { id: '4', hora: '09:00', paciente: 'Jorge Mendoza C.', cedula: '17.384.920', medico: 'Dra. Martínez', producto: 'TRAVAD PIK', preparacion: null, estado: 'en_curso', indicadores: {} },
  { id: '5', hora: '09:30', paciente: 'Patricia Sánchez R.', cedula: '65.432.178', medico: 'Dr. Hernández', producto: 'NULYTELY', preparacion: null, estado: 'en_curso', indicadores: {} },
  { id: '6', hora: '10:00', paciente: 'Roberto Jiménez L.', cedula: '91.827.364', medico: 'Dra. Martínez', producto: 'COLONLYTELY', preparacion: null, estado: 'programado', indicadores: {} },
  { id: '7', hora: '10:30', paciente: 'Carmen Díaz Forero', cedula: '28.374.619', medico: 'Dr. Hernández', producto: 'TRAVAD PIK', preparacion: null, estado: 'programado', indicadores: {} },
  { id: '8', hora: '11:00', paciente: 'Luis Alberto Cruz', cedula: '74.829.301', medico: 'Dra. Martínez', producto: 'COLONLYTELY', preparacion: null, estado: 'programado', indicadores: {} },
]

async function getProcedimientosHoy(centroId: string): Promise<ProcRow[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const hoy = new Date()
    const inicio = new Date(hoy); inicio.setHours(0, 0, 0, 0)
    const fin = new Date(hoy); fin.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('procedimientos')
      .select('*, pacientes(nombre, cedula), medico:usuarios!medico_id(nombre)')
      .eq('centro_id', centroId)
      .gte('fecha', inicio.toISOString())
      .lte('fecha', fin.toISOString())
      .order('fecha', { ascending: true })

    if (!data || data.length === 0) return DEMO

    return (data as unknown as Procedimiento[]).map((p) => ({
      id: p.id,
      hora: new Date(p.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      paciente: (p.pacientes as { nombre: string })?.nombre ?? '—',
      cedula: (p.pacientes as { cedula: string })?.cedula ?? '',
      medico: (p.medico as { nombre: string })?.nombre ?? '—',
      producto: p.producto,
      preparacion: (p.indicadores as Record<string, string>)?.preparacion ?? null,
      estado: p.estado,
      indicadores: (p.indicadores ?? {}) as Record<string, string>,
    }))
  } catch {
    return DEMO
  }
}

export default async function EnfermeriaPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'enfermera' && usuario.rol !== 'admin') redirect('/login')

  const procedimientos = usuario.centro_id
    ? await getProcedimientosHoy(usuario.centro_id)
    : DEMO

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        subtitulo={usuario.centros?.nombre ?? 'Centro'}
        nombre={usuario.nombre}
        rol="Enfermería"
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-navy">Panel de Enfermería</h2>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{fechaHoy}</p>
        </div>
        <ProcedimientosDashboard procedimientos={procedimientos} />
      </main>
    </div>
  )
}
