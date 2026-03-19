import { redirect } from 'next/navigation'
import { getUsuario } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { FormularioPaciente } from './FormularioPaciente'

export default async function PacientePage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'paciente' && usuario.rol !== 'admin') redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader subtitulo="Portal del Paciente" nombre={usuario.nombre} />

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-navy">Registro de preparación</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Completa el formulario antes de tu colonoscopia
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <FormularioPaciente />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Enfoque 360 · Tecnoquímicas · Información confidencial
        </p>
      </main>
    </div>
  )
}
