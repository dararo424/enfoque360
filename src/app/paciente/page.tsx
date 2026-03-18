import { redirect } from 'next/navigation'
import { getUsuario } from '@/lib/supabase-server'
import { LogOut, FileText, Calendar, Bell } from 'lucide-react'

export default async function PacientePage() {
  const usuario = await getUsuario()

  if (!usuario) redirect('/login')
  if (usuario.rol !== 'paciente' && usuario.rol !== 'admin') redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white font-bold text-sm">E</div>
          <div>
            <h1 className="font-semibold text-sm">Enfoque 360</h1>
            <p className="text-xs text-white/60">Portal del Paciente</p>
          </div>
        </div>
        <form action="/auth/signout" method="POST">
          <button type="submit" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-navy">Bienvenido, {usuario.nombre}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Portal de seguimiento de colonoscopia</p>
        </div>

        <div className="grid gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-teal" />
              <h3 className="font-semibold text-navy text-sm">Mi próxima cita</h3>
            </div>
            <p className="text-sm text-gray-500">No hay citas programadas.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-teal" />
              <h3 className="font-semibold text-navy text-sm">Instrucciones de preparación</h3>
            </div>
            <p className="text-sm text-gray-500">Las instrucciones aparecerán aquí cuando tenga un procedimiento asignado.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-teal" />
              <h3 className="font-semibold text-navy text-sm">Notificaciones</h3>
            </div>
            <p className="text-sm text-gray-500">Sin notificaciones pendientes.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
