import { redirect } from 'next/navigation'
import { getUsuario, createServerSupabaseClient } from '@/lib/supabase-server'
import { LogOut, Building2, Users, BarChart3, TrendingUp } from 'lucide-react'

export default async function TQAdminPage() {
  const usuario = await getUsuario()

  if (!usuario) redirect('/login')
  if (usuario.rol !== 'admin') redirect('/login')

  const supabase = await createServerSupabaseClient()

  // Datos globales
  const [{ count: totalCentros }, { count: totalProcedimientos }, { count: totalUsuarios }] =
    await Promise.all([
      supabase.from('centros').select('*', { count: 'exact', head: true }),
      supabase.from('procedimientos').select('*', { count: 'exact', head: true }),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }),
    ])

  const stats = [
    { icon: <Building2 className="w-5 h-5 text-teal" />, label: 'Centros activos', value: (totalCentros ?? 0).toString(), color: 'bg-teal-light' },
    { icon: <Users className="w-5 h-5 text-navy" />, label: 'Usuarios registrados', value: (totalUsuarios ?? 0).toString(), color: 'bg-navy/5' },
    { icon: <BarChart3 className="w-5 h-5 text-purple-600" />, label: 'Total procedimientos', value: (totalProcedimientos ?? 0).toString(), color: 'bg-purple-50' },
    { icon: <TrendingUp className="w-5 h-5 text-green-600" />, label: '% Preparación adecuada', value: '—', color: 'bg-green-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white font-bold text-sm">E</div>
          <div>
            <h1 className="font-semibold text-sm">Enfoque 360</h1>
            <p className="text-xs text-white/60">Panel Tecnoquímicas</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm hidden sm:block">{usuario.nombre}</p>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-navy">Panel Tecnoquímicas (TQ)</h2>
          <p className="text-sm text-gray-500 mt-0.5">Vista agregada nacional · Todos los centros</p>
        </div>

        {/* KPIs globales */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className={`${s.color} rounded-2xl p-5 flex items-start gap-4`}>
              {s.icon}
              <div>
                <p className="text-2xl font-bold text-navy">{s.value}</p>
                <p className="text-sm text-gray-600">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder gráficas */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-navy mb-4">Procedimientos por mes</h3>
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm border-2 border-dashed border-gray-100 rounded-xl">
              Gráfica — próximamente con Recharts
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-navy mb-4">Calidad de preparación por centro</h3>
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm border-2 border-dashed border-gray-100 rounded-xl">
              Gráfica — próximamente con Recharts
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
