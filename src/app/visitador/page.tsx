import { redirect } from 'next/navigation'
import { getUsuario, createServerSupabaseClient } from '@/lib/supabase-server'
import type { CentroPrograma, Visita, NovedadFase } from '@/lib/supabase'
import { VisitadorShell } from './VisitadorShell'

export default async function VisitadorPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (!['visitador', 'gerente', 'admin'].includes(usuario.rol)) redirect('/login')

  const supabase = await createServerSupabaseClient()

  const [centrosRes, visitasRes, novedadesRes] = await Promise.all([
    supabase.from('centros_programa').select('*').order('ciudad').order('nombre'),
    supabase
      .from('visitas')
      .select('*, centros_programa(*)')
      .eq('visitador_id', usuario.id)
      .order('fecha', { ascending: false }),
    supabase
      .from('novedades')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(20),
  ])

  const centros   = (centrosRes.data   ?? []) as CentroPrograma[]
  const visitas   = (visitasRes.data   ?? []) as Visita[]
  const novedades = (novedadesRes.data ?? []) as NovedadFase[]

  return (
    <VisitadorShell
      nombre={usuario.nombre}
      centros={centros}
      visitas={visitas}
      novedades={novedades}
      esGerenteEnVistaVisitador={usuario.rol === 'gerente'}
    />
  )
}
