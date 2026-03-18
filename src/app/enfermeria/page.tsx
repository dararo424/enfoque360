import { redirect } from 'next/navigation'
import { Activity, Users, CheckCircle2, Loader2, LogOut } from 'lucide-react'
import { createServerSupabaseClient, getUsuario } from '@/lib/supabase-server'
import { ProcedimientosList } from './ProcedimientosList'
import type { Procedimiento } from '@/lib/supabase'

async function getProcedimientosHoy(centroId: string): Promise<Procedimiento[]> {
  const supabase = await createServerSupabaseClient()

  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)
  const hoyFin = new Date()
  hoyFin.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('procedimientos')
    .select(`
      *,
      pacientes (id, nombre, cedula, edad),
      enfermera:usuarios!enfermera_id (id, nombre),
      medico:usuarios!medico_id (id, nombre)
    `)
    .eq('centro_id', centroId)
    .gte('fecha', hoyInicio.toISOString())
    .lte('fecha', hoyFin.toISOString())
    .order('fecha', { ascending: true })

  if (error) {
    console.error('Error fetching procedimientos:', error)
    return []
  }

  return (data ?? []) as unknown as Procedimiento[]
}

export default async function EnfermeriaPage() {
  const usuario = await getUsuario()

  if (!usuario) {
    redirect('/login')
  }

  if (usuario.rol !== 'enfermera' && usuario.rol !== 'admin') {
    redirect('/login')
  }

  const centroId = usuario.centro_id ?? ''
  const procedimientos = centroId ? await getProcedimientosHoy(centroId) : []

  // ---- KPIs ----
  const total = procedimientos.length
  const enCurso = procedimientos.filter((p) => p.estado === 'en_curso').length
  const completados = procedimientos.filter((p) => p.estado === 'completado').length

  const conPreparacionAdecuada = procedimientos.filter((p) => {
    const prep = (p.indicadores as Record<string, string>)?.preparacion
    return prep === 'excelente' || prep === 'buena' || prep === 'regular'
  }).length
  const pctPreparacion =
    completados > 0 ? Math.round((conPreparacionAdecuada / completados) * 100) : null

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <div>
            <h1 className="font-semibold text-sm">Enfoque 360</h1>
            <p className="text-xs text-white/60">{usuario.centros?.nombre ?? 'Centro'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{usuario.nombre}</p>
            <p className="text-xs text-white/60 capitalize">{usuario.rol}</p>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-navy">Panel de Enfermería</h2>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{fechaHoy}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <KpiCard
            icon={<Users className="w-5 h-5 text-teal" />}
            label="Total del día"
            value={total.toString()}
            color="bg-teal-light"
          />
          <KpiCard
            icon={<Loader2 className="w-5 h-5 text-orange-500" />}
            label="En curso"
            value={enCurso.toString()}
            color="bg-orange-50"
          />
          <KpiCard
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
            label="% Preparación adecuada"
            value={pctPreparacion !== null ? `${pctPreparacion}%` : '—'}
            sublabel={pctPreparacion !== null ? `${conPreparacionAdecuada} de ${completados}` : 'Sin datos aún'}
            color="bg-green-50"
          />
        </div>

        {/* Tabla de procedimientos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-navy">Procedimientos de hoy</h3>
              <p className="text-xs text-gray-400 mt-0.5">{total} en total</p>
            </div>
            <Activity className="w-5 h-5 text-teal" />
          </div>

          <ProcedimientosList procedimientos={procedimientos} />
        </div>

        {/* Nota de uso */}
        {total === 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Los procedimientos se cargan desde Supabase. Verifica que el esquema esté aplicado y haya datos de prueba.
          </p>
        )}
      </main>
    </div>
  )
}

// ---- Componente KPI ----
function KpiCard({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sublabel?: string
  color: string
}) {
  return (
    <div className={`${color} rounded-2xl p-5 flex items-start gap-4`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-navy">{value}</p>
        <p className="text-sm text-gray-600 mt-0.5">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}
