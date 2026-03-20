import { redirect } from 'next/navigation'
import { getUsuario } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { obtenerNovedades } from '@/lib/actions'
import { TQPanel } from './TQPanel'

export default async function TQPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'admin') redirect('/login')

  const novedades = await obtenerNovedades().catch(() => [])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader subtitulo="Panel Tecnoquímicas · Nacional" nombre={usuario.nombre} rol="Administrador TQ" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-navy">Panel Tecnoquímicas</h2>
          <p className="text-sm text-gray-500 mt-0.5">Vista agregada nacional</p>
        </div>
        <TQPanel novedadesIniciales={novedades} />
      </main>
    </div>
  )
}
