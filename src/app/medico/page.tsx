import { redirect } from 'next/navigation'
import { getUsuario, createServerSupabaseClient } from '@/lib/supabase-server'
import { LogOut, Stethoscope, BarChart3, ClipboardList } from 'lucide-react'

export default async function MedicoPage() {
  const usuario = await getUsuario()

  if (!usuario) redirect('/login')
  if (usuario.rol !== 'medico' && usuario.rol !== 'admin') redirect('/login')

  const supabase = await createServerSupabaseClient()

  // Últimos 5 procedimientos del médico
  const { data: procedimientos } = await supabase
    .from('procedimientos')
    .select('*, pacientes(nombre, cedula)')
    .eq('medico_id', usuario.id)
    .order('fecha', { ascending: false })
    .limit(5)

  const total = procedimientos?.length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white font-bold text-sm">E</div>
          <div>
            <h1 className="font-semibold text-sm">Enfoque 360</h1>
            <p className="text-xs text-white/60">{usuario.centros?.nombre ?? 'Centro'}</p>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-navy">Panel Médico</h2>
          <p className="text-sm text-gray-500 mt-0.5">Dr. {usuario.nombre}</p>
        </div>

        {/* Stats rápidos */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Stethoscope className="w-5 h-5 text-teal" />, label: 'Mis procedimientos', value: total.toString(), color: 'bg-teal-light' },
            { icon: <BarChart3 className="w-5 h-5 text-navy" />, label: 'Tasa detección pólipos', value: '—', color: 'bg-navy/5' },
            { icon: <ClipboardList className="w-5 h-5 text-green-600" />, label: 'Completados hoy', value: '0', color: 'bg-green-50' },
          ].map((item) => (
            <div key={item.label} className={`${item.color} rounded-2xl p-5 flex items-start gap-4`}>
              {item.icon}
              <div>
                <p className="text-2xl font-bold text-navy">{item.value}</p>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lista procedimientos recientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-navy">Procedimientos recientes</h3>
          </div>
          {(procedimientos ?? []).length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">Sin procedimientos registrados</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {procedimientos?.map((p) => (
                <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{(p.pacientes as { nombre: string })?.nombre}</p>
                    <p className="text-xs text-gray-500">{new Date(p.fecha).toLocaleDateString('es-CO')} · {p.producto}</p>
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{p.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
