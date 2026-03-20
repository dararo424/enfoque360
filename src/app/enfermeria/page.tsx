import { redirect } from 'next/navigation'
import { createServerSupabaseClient, getUsuario } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { ProcedimientosDashboard } from './ProcedimientosDashboard'

// ---- Tipo compartido ----
export interface ProcRow {
  id: string
  hora: string
  paciente: string
  cedula: string
  medico: string
  producto: string
  /** Calidad de prep registrada por enfermería */
  preparacion: string | null
  estado: 'programado' | 'en_curso' | 'completado' | 'cancelado'
  indicadores: Record<string, string>
  /** Lo que registró el paciente antes del procedimiento */
  preparacion_paciente: {
    producto?: string
    horas_ayuno?: string
    alimentos_consumidos?: string
    observaciones?: string
    registrado_en?: string
  } | null
}

// ---- Datos demo (fallback cuando Supabase no tiene datos) ----
const DEMO: ProcRow[] = [
  { id: '1', hora: '07:30', paciente: 'María García López',   cedula: '52.847.163', medico: 'Dr. Hernández',  producto: 'COLONLYTELY', preparacion: 'excelente', estado: 'completado', indicadores: { intubacion_cecal: 'Sí', tiempo_retirada: '8', adenomas: '0' }, preparacion_paciente: { producto: 'COLONLYTELY', horas_ayuno: '10', alimentos_consumidos: 'Solo líquidos claros', registrado_en: new Date().toISOString() } },
  { id: '2', hora: '08:00', paciente: 'Carlos Rodríguez P.',  cedula: '80.213.456', medico: 'Dr. Hernández',  producto: 'COLONLYTELY', preparacion: 'buena',     estado: 'completado', indicadores: { intubacion_cecal: 'Sí', tiempo_retirada: '10', adenomas: '1' }, preparacion_paciente: { producto: 'COLONLYTELY', horas_ayuno: '8', alimentos_consumidos: 'Caldo, gelatina', registrado_en: new Date().toISOString() } },
  { id: '3', hora: '08:30', paciente: 'Ana Torres Vega',      cedula: '43.217.890', medico: 'Dra. Martínez', producto: 'TRAVAD PIK',  preparacion: 'regular',   estado: 'completado', indicadores: { intubacion_cecal: 'Sí', tiempo_retirada: '9',  adenomas: '0' }, preparacion_paciente: { producto: 'TRAVAD PIK', horas_ayuno: '6', observaciones: 'Náuseas leves durante la preparación', registrado_en: new Date().toISOString() } },
  { id: '4', hora: '09:00', paciente: 'Jorge Mendoza C.',     cedula: '17.384.920', medico: 'Dra. Martínez', producto: 'TRAVAD PIK',  preparacion: null,        estado: 'en_curso',   indicadores: {}, preparacion_paciente: { producto: 'TRAVAD PIK', horas_ayuno: '8' } },
  { id: '5', hora: '09:30', paciente: 'Patricia Sánchez R.',  cedula: '65.432.178', medico: 'Dr. Hernández',  producto: 'NULYTELY',   preparacion: null,        estado: 'en_curso',   indicadores: {}, preparacion_paciente: null },
  { id: '6', hora: '10:00', paciente: 'Roberto Jiménez L.',   cedula: '91.827.364', medico: 'Dra. Martínez', producto: 'COLONLYTELY', preparacion: null,        estado: 'programado', indicadores: {}, preparacion_paciente: { producto: 'COLONLYTELY', horas_ayuno: '12' } },
  { id: '7', hora: '10:30', paciente: 'Carmen Díaz Forero',   cedula: '28.374.619', medico: 'Dr. Hernández',  producto: 'TRAVAD PIK',  preparacion: null,        estado: 'programado', indicadores: {}, preparacion_paciente: null },
  { id: '8', hora: '11:00', paciente: 'Luis Alberto Cruz',    cedula: '74.829.301', medico: 'Dra. Martínez', producto: 'COLONLYTELY', preparacion: null,        estado: 'programado', indicadores: {}, preparacion_paciente: null },
]

async function getProcedimientosHoy(centroId: string): Promise<ProcRow[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const hoy = new Date()
    const inicio = new Date(hoy); inicio.setHours(0, 0, 0, 0)
    const fin    = new Date(hoy); fin.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('procedimientos')
      .select(`
        id, fecha, producto, estado, indicadores,
        pacientes (nombre, cedula, preparacion),
        medico:usuarios!medico_id (nombre)
      `)
      .eq('centro_id', centroId)
      .gte('fecha', inicio.toISOString())
      .lte('fecha', fin.toISOString())
      .order('fecha', { ascending: true })

    if (!data || data.length === 0) return DEMO

    return data.map((p) => {
      const pac = Array.isArray(p.pacientes) ? (p.pacientes[0] as { nombre: string; cedula: string; preparacion: Record<string, string> } | undefined) : (p.pacientes as unknown as { nombre: string; cedula: string; preparacion: Record<string, string> } | null)
      const med = Array.isArray(p.medico) ? (p.medico[0] as { nombre: string } | undefined) : (p.medico as unknown as { nombre: string } | null)
      const ind = (p.indicadores ?? {}) as Record<string, string>
      return {
        id:       p.id,
        hora:     new Date(p.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        paciente: pac?.nombre ?? '—',
        cedula:   pac?.cedula ?? '',
        medico:   med?.nombre ?? '—',
        producto: p.producto,
        preparacion: ind.preparacion ?? null,
        estado:   p.estado as ProcRow['estado'],
        indicadores: ind,
        preparacion_paciente: pac?.preparacion
          ? (pac.preparacion as unknown as ProcRow['preparacion_paciente'])
          : null,
      }
    })
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
