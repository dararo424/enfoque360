'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from './supabase-server'

// ---- Helpers ----
function esUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

// ================================================================
// MÓDULO PACIENTE
// ================================================================

export async function registrarPreparacionPaciente(data: {
  nombre: string
  cedula: string
  edad: number
  producto: string
  horasAyuno: string
  alimentosConsumidos: string
  observaciones: string
  consentimiento: boolean
}): Promise<{ id: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Buscar usuario autenticado en tabla usuarios (puede ser null si no tiene rol aún)
  let usuarioId: string | null = null
  if (user) {
    const { data: u } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    usuarioId = u?.id ?? null
  }

  const preparacion = {
    producto:             data.producto,
    horas_ayuno:          data.horasAyuno,
    alimentos_consumidos: data.alimentosConsumidos,
    observaciones:        data.observaciones,
    consentimiento:       data.consentimiento,
    registrado_en:        new Date().toISOString(),
  }

  // Upsert por cédula
  const { data: paciente, error } = await supabase
    .from('pacientes')
    .upsert(
      {
        nombre:      data.nombre,
        cedula:      data.cedula,
        edad:        data.edad,
        usuario_id:  usuarioId,
        preparacion,
      },
      { onConflict: 'cedula' }
    )
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // Si hay un procedimiento programado hoy para este paciente, actualizar también
  const hoy = new Date()
  const inicio = new Date(hoy); inicio.setHours(0, 0, 0, 0)
  const fin    = new Date(hoy); fin.setHours(23, 59, 59, 999)

  await supabase
    .from('procedimientos')
    .update({ indicadores: { preparacion_paciente: preparacion } as Record<string, unknown> })
    .eq('paciente_id', paciente.id)
    .gte('fecha', inicio.toISOString())
    .lte('fecha', fin.toISOString())
    .eq('estado', 'programado')

  revalidatePath('/enfermeria')

  return { id: `ENF-${paciente.id.split('-')[0].toUpperCase()}` }
}

// ================================================================
// MÓDULO ENFERMERÍA
// ================================================================

export async function guardarIndicadoresProcedimiento(
  procedimientoId: string,
  indicadores: Record<string, string>,
  estado: string
): Promise<void> {
  if (!esUUID(procedimientoId)) return // demo data — no persiste

  const supabase = await createServerSupabaseClient()

  // Obtener indicadores actuales para hacer merge
  const { data: actual } = await supabase
    .from('procedimientos')
    .select('indicadores')
    .eq('id', procedimientoId)
    .single()

  const indicadoresActualizados = {
    ...(actual?.indicadores as Record<string, unknown> ?? {}),
    ...indicadores,
  }

  const { error } = await supabase
    .from('procedimientos')
    .update({ indicadores: indicadoresActualizados, estado })
    .eq('id', procedimientoId)

  if (error) throw new Error(error.message)
  revalidatePath('/enfermeria')
}

export async function iniciarProcedimiento(procedimientoId: string): Promise<void> {
  if (!esUUID(procedimientoId)) return

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('procedimientos')
    .update({
      estado: 'en_curso',
      inicio_procedimiento: new Date().toISOString(),
    } as never)
    .eq('id', procedimientoId)

  if (error) throw new Error(error.message)
  revalidatePath('/enfermeria')
}

export async function finalizarProcedimiento(procedimientoId: string): Promise<void> {
  if (!esUUID(procedimientoId)) return

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('procedimientos')
    .update({
      estado: 'completado',
      fin_procedimiento: new Date().toISOString(),
    } as never)
    .eq('id', procedimientoId)

  if (error) throw new Error(error.message)
  revalidatePath('/enfermeria')
}

// ================================================================
// MÓDULO ADMIN — CENTROS
// ================================================================

export async function crearCentro(data: {
  nombre: string
  ciudad: string
  regional: string
}): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('centros').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function actualizarCentro(
  id: string,
  data: { nombre: string; ciudad: string; regional: string }
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('centros').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ================================================================
// MÓDULO ADMIN — USUARIOS
// ================================================================

export async function actualizarUsuario(
  id: string,
  data: { rol: string; centro_id: string | null }
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('usuarios').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ================================================================
// MÓDULO ADMIN — PACIENTES Y PROCEDIMIENTOS
// ================================================================

export async function buscarPacientePorCedula(cedula: string): Promise<{
  id: string
  nombre: string
  cedula: string
  edad: number
} | null> {
  const supabase = await createServerSupabaseClient()
  const cedulaLimpia = cedula.replace(/[.\s]/g, '')

  const { data } = await supabase
    .from('pacientes')
    .select('id, nombre, cedula, edad')
    .or(`cedula.eq.${cedulaLimpia},cedula.eq.${cedula}`)
    .maybeSingle()

  return data as { id: string; nombre: string; cedula: string; edad: number } | null
}

export async function programarProcedimiento(data: {
  pacienteId:      string | null
  nuevoPaciente:   { nombre: string; cedula: string; edad: number } | null
  medicoId:        string
  enfermeraId:     string | null
  centroId:        string
  fecha:           string
  producto:        string
}): Promise<void> {
  const supabase = await createServerSupabaseClient()

  let pacienteId = data.pacienteId

  // Crear paciente si no existe
  if (!pacienteId && data.nuevoPaciente) {
    const { data: nuevo, error } = await supabase
      .from('pacientes')
      .upsert(
        {
          nombre:    data.nuevoPaciente.nombre,
          cedula:    data.nuevoPaciente.cedula,
          edad:      data.nuevoPaciente.edad,
          centro_id: data.centroId,
        },
        { onConflict: 'cedula' }
      )
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    pacienteId = nuevo.id
  }

  if (!pacienteId) throw new Error('Paciente requerido')

  const { error } = await supabase.from('procedimientos').insert({
    paciente_id:  pacienteId,
    medico_id:    data.medicoId,
    enfermera_id: data.enfermeraId,
    centro_id:    data.centroId,
    fecha:        data.fecha,
    producto:     data.producto,
    estado:       'programado',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/enfermeria')
}
