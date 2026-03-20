import { redirect } from 'next/navigation'
import { getUsuario } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { cargarModulosCapacitacion, obtenerEstadoCertificacion } from '@/lib/actions'
import { CapacitacionView } from './CapacitacionView'

export default async function CapacitacionPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'enfermera' && usuario.rol !== 'admin') redirect('/login')

  const [modulos, estadoCert] = await Promise.all([
    cargarModulosCapacitacion(),
    obtenerEstadoCertificacion(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        subtitulo={usuario.centros?.nombre ?? 'Centro'}
        nombre={usuario.nombre}
        rol="Enfermería"
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <a href="/enfermeria" className="inline-flex items-center gap-1.5 text-xs text-teal font-medium hover:underline mb-3">
            ← Volver al dashboard
          </a>
          <h2 className="text-xl font-bold text-navy">Capacitación EMC</h2>
          <p className="text-sm text-gray-500 mt-0.5">Programa de Educación Médica Continua · Tecnoquímicas</p>
        </div>
        <CapacitacionView modulosIniciales={modulos} estadoCert={estadoCert} />
      </main>
    </div>
  )
}
