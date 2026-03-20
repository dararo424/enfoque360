import { redirect } from 'next/navigation'
import { getUsuario, createServerSupabaseClient } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { AdminPanel } from './AdminPanel'

export default async function AdminPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'admin') redirect('/tq')

  const supabase = await createServerSupabaseClient()

  const [
    { data: centros },
    { data: usuarios },
    { data: doctores },
    { data: enfermeras },
  ] = await Promise.all([
    supabase.from('centros').select('id, nombre, ciudad, regional').order('nombre'),
    supabase.from('usuarios').select('id, nombre, email, rol, centro_id, centros(nombre)').order('nombre'),
    supabase.from('usuarios').select('id, nombre').eq('rol', 'medico').order('nombre'),
    supabase.from('usuarios').select('id, nombre').eq('rol', 'enfermera').order('nombre'),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader subtitulo="Panel de Administración" nombre={usuario.nombre} rol="Administrador" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-navy">Administración</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de usuarios, centros y programación de procedimientos</p>
        </div>
        <AdminPanel
          centros={(centros ?? []) as { id: string; nombre: string; ciudad: string; regional: string }[]}
          usuarios={(usuarios ?? []) as unknown as { id: string; nombre: string; email: string; rol: string; centro_id: string | null; centros: { nombre: string } | null }[]}
          doctores={(doctores ?? []) as { id: string; nombre: string }[]}
          enfermeras={(enfermeras ?? []) as { id: string; nombre: string }[]}
        />
      </main>
    </div>
  )
}
