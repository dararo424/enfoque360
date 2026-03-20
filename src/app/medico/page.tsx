import { redirect } from 'next/navigation'
import { getUsuario, createServerSupabaseClient } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { MedicoPanel } from './MedicoPanel'
import type { ProcMedico } from './MedicoPanel'

// ---- Demo data ----
const DEMO: ProcMedico[] = [
  { id: '1', paciente: 'Luis Torres Pérez',   cedula: '74.829.301', fecha: '2026-03-18T08:30:00', producto: 'COLONLYTELY', estado: 'completado', prep: 'excelente',  adenomas: 2 },
  { id: '2', paciente: 'Sandra Ríos Cardona', cedula: '52.631.204', fecha: '2026-03-17T09:00:00', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'buena',       adenomas: 0 },
  { id: '3', paciente: 'Felipe Mora Agudelo', cedula: '1.098.345',  fecha: '2026-03-17T10:30:00', producto: 'COLONLYTELY', estado: 'completado', prep: 'regular',     adenomas: 1 },
  { id: '4', paciente: 'Diana Zuluaga Gómez', cedula: '43.812.760', fecha: '2026-03-16T08:00:00', producto: 'NULYTELY',    estado: 'completado', prep: 'buena',       adenomas: 0 },
  { id: '5', paciente: 'Andrés Patiño López', cedula: '80.127.543', fecha: '2026-03-15T09:30:00', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'inadecuada',  adenomas: 0 },
  { id: '6', paciente: 'Carmen López Silva',  cedula: '65.234.112', fecha: '2026-02-28T08:00:00', producto: 'COLONLYTELY', estado: 'completado', prep: 'buena',       adenomas: 1 },
  { id: '7', paciente: 'Roberto Díaz Vera',   cedula: '91.827.364', fecha: '2026-02-20T10:00:00', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'excelente',   adenomas: 3 },
  { id: '8', paciente: 'Ana Martínez Roa',    cedula: '28.374.619', fecha: '2026-02-10T09:00:00', producto: 'NULYTELY',    estado: 'completado', prep: 'inadecuada',  adenomas: 0 },
  { id: '9', paciente: 'Jorge Herrera P.',    cedula: '17.384.920', fecha: '2026-01-25T08:30:00', producto: 'COLONLYTELY', estado: 'completado', prep: 'buena',       adenomas: 0 },
  { id:'10', paciente: 'María Suárez C.',     cedula: '33.192.478', fecha: '2026-01-15T11:00:00', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'regular',     adenomas: 1 },
]

export default async function MedicoPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'medico' && usuario.rol !== 'admin') redirect('/login')

  let procedimientos: ProcMedico[] = DEMO
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('procedimientos')
      .select('id, fecha, producto, estado, indicadores, pacientes(nombre, cedula)')
      .eq('medico_id', usuario.id)
      .order('fecha', { ascending: false })
    if (data && data.length > 0) {
      procedimientos = data.map((p) => {
        const pac = Array.isArray(p.pacientes) ? p.pacientes[0] : (p.pacientes as { nombre: string; cedula: string } | null)
        const ind = (p.indicadores ?? {}) as Record<string, string>
        return {
          id: p.id,
          paciente: pac?.nombre ?? '—',
          cedula: pac?.cedula ?? '',
          fecha: p.fecha,
          producto: p.producto,
          estado: p.estado,
          prep:     ind.preparacion ?? '',
          adenomas: Number(ind.adenomas ?? 0),
        }
      })
    }
  } catch { /* usa demo */ }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader subtitulo={usuario.centros?.nombre ?? 'Centro'} nombre={usuario.nombre} rol="Médico" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-navy">Panel Médico</h2>
          <p className="text-sm text-gray-500 mt-0.5">{usuario.centros?.nombre ?? 'Centro'}</p>
        </div>
        <MedicoPanel
          procedimientos={procedimientos}
          nombreMedico={usuario.nombre}
          centraNombre={usuario.centros?.nombre ?? 'Centro'}
        />
      </main>
    </div>
  )
}
