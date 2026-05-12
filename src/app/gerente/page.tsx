import { redirect } from 'next/navigation'
import { getUsuario, createServerSupabaseClient } from '@/lib/supabase-server'
import type { CentroPrograma, Visita, NovedadFase } from '@/lib/supabase'
import { GerenteShell } from './GerenteShell'

export default async function GerentePage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (!['gerente', 'admin'].includes(usuario.rol)) redirect('/login')

  const supabase = await createServerSupabaseClient()

  // El gerente ve TODO: todos los centros, todas las visitas (sin filtrar por visitador), todas las novedades
  const [centrosRes, visitasRes, novedadesRes] = await Promise.all([
    supabase.from('centros_programa').select('*').order('ciudad').order('nombre'),
    supabase
      .from('visitas')
      .select('*, centros_programa(*), visitador:usuarios!visitador_id(nombre, email)')
      .order('fecha', { ascending: false }),
    supabase
      .from('novedades')
      .select('*, centros_programa(nombre, ciudad)')
      .order('fecha', { ascending: false })
      .limit(100),
  ])

  const centros   = (centrosRes.data   ?? []) as (CentroPrograma & {})[]
  const visitas   = (visitasRes.data   ?? []) as (Visita & { visitador?: { nombre: string; email: string } | null })[]
  const novedades = (novedadesRes.data ?? []) as NovedadFase[]

  return (
    <GerenteShell
      nombre={usuario.nombre}
      centros={centros}
      visitas={visitas}
      novedades={novedades}
    />
  )
}
