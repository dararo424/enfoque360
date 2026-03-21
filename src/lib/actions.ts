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
  telefono?: string
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

  const preparacion: Record<string, unknown> = {
    producto:             data.producto,
    horas_ayuno:          data.horasAyuno,
    alimentos_consumidos: data.alimentosConsumidos,
    observaciones:        data.observaciones,
    consentimiento:       data.consentimiento,
    registrado_en:        new Date().toISOString(),
  }
  if (data.telefono) preparacion.telefono = data.telefono

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

export async function obtenerProximoProcedimientoPaciente(): Promise<{
  id: string
  fecha: string
  protocolo_confirmado: boolean
  archivo_url: string | null
} | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: pac } = await supabase
      .from('pacientes')
      .select('id')
      .eq('usuario_id', user.id)
      .maybeSingle()
    if (!pac) return null

    const { data } = await supabase
      .from('procedimientos')
      .select('id, fecha, indicadores')
      .eq('paciente_id', pac.id)
      .eq('estado', 'programado')
      .gte('fecha', new Date().toISOString())
      .order('fecha', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!data) return null
    const ind = (data.indicadores ?? {}) as Record<string, unknown>
    return {
      id: data.id,
      fecha: data.fecha,
      protocolo_confirmado: Boolean(ind.protocolo_confirmado),
      archivo_url: (ind.archivo_protocolo as string | null) ?? null,
    }
  } catch { return null }
}

export async function confirmarProtocolo(procedimientoId: string): Promise<void> {
  if (!esUUID(procedimientoId)) return
  const supabase = await createServerSupabaseClient()

  const { data: actual } = await supabase
    .from('procedimientos')
    .select('indicadores')
    .eq('id', procedimientoId)
    .single()

  await supabase
    .from('procedimientos')
    .update({
      indicadores: {
        ...(actual?.indicadores as Record<string, unknown> ?? {}),
        protocolo_confirmado: true,
        protocolo_confirmado_en: new Date().toISOString(),
      },
    })
    .eq('id', procedimientoId)

  revalidatePath('/paciente')
  revalidatePath('/enfermeria')
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

  // Obtener centro_id antes de finalizar para verificar novedades
  const { data: proc } = await supabase
    .from('procedimientos')
    .select('centro_id')
    .eq('id', procedimientoId)
    .single()

  const { error } = await supabase
    .from('procedimientos')
    .update({
      estado: 'completado',
      fin_procedimiento: new Date().toISOString(),
    } as never)
    .eq('id', procedimientoId)

  if (error) throw new Error(error.message)

  // Verificar si se deben generar novedades automáticas para el centro
  if (proc?.centro_id) {
    await verificarYGenerarNovedades(proc.centro_id).catch(() => {/* no bloquear si falla */})
  }

  revalidatePath('/enfermeria')
}

// ================================================================
// MÓDULO CAPACITACIÓN
// ================================================================

export interface ModuloConProgreso {
  id: string
  titulo: string
  descripcion: string
  duracion_min: number
  tipo: 'video' | 'lectura' | 'evaluacion'
  orden: number
  completado: boolean
  puntaje: number | null
  bloqueado: boolean
}

export async function cargarModulosCapacitacion(): Promise<ModuloConProgreso[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: modulos }, { data: progreso }] = await Promise.all([
    supabase.from('modulos_capacitacion').select('*').order('orden'),
    supabase.from('progreso_capacitacion').select('*').eq('usuario_id', user.id),
  ])

  if (!modulos) return []

  const progresoMap: Record<string, { completado: boolean; puntaje: number | null }> = {}
  for (const p of progreso ?? []) {
    progresoMap[p.modulo_id] = { completado: p.completado, puntaje: p.puntaje }
  }

  return modulos.map((m, i) => {
    const prog = progresoMap[m.id]
    const completado = prog?.completado ?? false
    // Un módulo está bloqueado si el anterior no está completado
    const anterior = i > 0 ? modulos[i - 1] : null
    const bloqueado = anterior ? !(progresoMap[anterior.id]?.completado ?? false) : false
    return {
      id:          m.id,
      titulo:      m.titulo,
      descripcion: m.descripcion ?? '',
      duracion_min: m.duracion_min ?? 30,
      tipo:        m.tipo as ModuloConProgreso['tipo'],
      orden:       m.orden,
      completado,
      puntaje:     prog?.puntaje ?? null,
      bloqueado,
    }
  })
}

export async function marcarModuloCompletado(
  moduloId: string,
  puntaje?: number
): Promise<void> {
  if (!esUUID(moduloId)) return

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('progreso_capacitacion')
    .upsert(
      {
        usuario_id:       user.id,
        modulo_id:        moduloId,
        completado:       true,
        puntaje:          puntaje ?? null,
        fecha_completado: new Date().toISOString(),
      },
      { onConflict: 'usuario_id,modulo_id' }
    )

  if (error) throw new Error(error.message)
  revalidatePath('/enfermeria/capacitacion')
}

// ================================================================
// MÓDULO NOVEDADES — GENERACIÓN AUTOMÁTICA
// ================================================================

const UMBRAL_REPROCESO_ALTO  = 20 // %
const UMBRAL_REPROCESO_MEDIO = 15 // %
const DIAS_ANALISIS          = 30

export async function verificarYGenerarNovedades(centroId: string): Promise<void> {
  if (!esUUID(centroId)) return

  const supabase = await createServerSupabaseClient()

  const desde = new Date()
  desde.setDate(desde.getDate() - DIAS_ANALISIS)

  // Obtener procedimientos completados del centro en los últimos N días
  const { data: procs } = await supabase
    .from('procedimientos')
    .select('id, indicadores')
    .eq('centro_id', centroId)
    .eq('estado', 'completado')
    .gte('fecha', desde.toISOString())

  if (!procs || procs.length < 5) return // muy pocos datos, no generar alerta

  const total = procs.length
  const inadecuados = procs.filter((p) => {
    const ind = (p.indicadores ?? {}) as Record<string, string>
    return ind.preparacion === 'inadecuada'
  }).length

  const pctReprocesos = Math.round((inadecuados / total) * 100)

  if (pctReprocesos < UMBRAL_REPROCESO_MEDIO) return

  const nivel = pctReprocesos >= UMBRAL_REPROCESO_ALTO ? 'alto' : 'medio'

  // Verificar si ya hay una novedad abierta de tipo reproceso para este centro
  const { data: existente } = await supabase
    .from('novedades')
    .select('id')
    .eq('centro_id', centroId)
    .eq('tipo', 'reproceso')
    .in('estado', ['abierta', 'en_gestion'])
    .maybeSingle()

  if (existente) return // ya existe alerta activa

  // Obtener nombre del centro para el título
  const { data: centro } = await supabase
    .from('centros')
    .select('nombre')
    .eq('id', centroId)
    .single()

  await supabase.from('novedades').insert({
    tipo:        'reproceso',
    nivel,
    titulo:      `${pctReprocesos}% de reprocesos en ${centro?.nombre ?? 'centro'}`,
    descripcion: `En los últimos ${DIAS_ANALISIS} días se registraron ${inadecuados} preparaciones inadecuadas de ${total} procedimientos (${pctReprocesos}%). ${nivel === 'alto' ? 'Requiere intervención inmediata.' : 'Se recomienda revisar el protocolo de preparación.'}`,
    centro_id:   centroId,
    responsable: 'TQ Nacional',
    sla_dias:    nivel === 'alto' ? 3 : 7,
    estado:      'abierta',
  })

  revalidatePath('/tq')
}

// ---- Certificaciones ----
const DIAS_VIGENCIA_CERT  = 365
const DIAS_AVISO_VENCIMIENTO = 30

export interface EstadoCertificacion {
  vigente: boolean
  fechaObtencion: string | null
  fechaVencimiento: string | null
  diasRestantes: number | null   // negativo = ya venció
  proximaAVencer: boolean
}

/** Resumen de certificaciones por centro para la vista TQ */
export async function obtenerResumenCertificaciones(): Promise<Record<string, {
  certificadas: number
  vencenEn30: number
  vencidas: number
}>> {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('progreso_capacitacion')
    .select('usuario_id, puntaje, fecha_completado, completado, modulos_capacitacion(tipo), usuarios(centro_id)')
    .eq('completado', true)

  if (!data) return {}

  const resumen: Record<string, { certificadas: number; vencenEn30: number; vencidas: number }> = {}

  for (const p of data) {
    const mod     = Array.isArray(p.modulos_capacitacion) ? p.modulos_capacitacion[0] : p.modulos_capacitacion
    const usuario = Array.isArray(p.usuarios) ? p.usuarios[0] : p.usuarios as { centro_id: string } | null
    if ((mod as { tipo: string } | null)?.tipo !== 'evaluacion') continue
    if ((p.puntaje ?? 0) < 80) continue
    if (!usuario?.centro_id || !p.fecha_completado) continue

    const centroId = usuario.centro_id
    if (!resumen[centroId]) resumen[centroId] = { certificadas: 0, vencenEn30: 0, vencidas: 0 }

    const vence = new Date(p.fecha_completado)
    vence.setDate(vence.getDate() + DIAS_VIGENCIA_CERT)
    const dias = Math.floor((vence.getTime() - Date.now()) / 86400000)

    resumen[centroId].certificadas++
    if (dias <= 0)                     resumen[centroId].vencidas++
    else if (dias <= DIAS_AVISO_VENCIMIENTO) resumen[centroId].vencenEn30++
  }

  return resumen
}

export async function obtenerEstadoCertificacion(): Promise<EstadoCertificacion> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { vigente: false, fechaObtencion: null, fechaVencimiento: null, diasRestantes: null, proximaAVencer: false }

  // Buscar el módulo de evaluación completado más reciente
  const { data } = await supabase
    .from('progreso_capacitacion')
    .select('fecha_completado, puntaje, modulos_capacitacion(tipo)')
    .eq('usuario_id', user.id)
    .eq('completado', true)
    .order('fecha_completado', { ascending: false })

  const evalCompletada = data?.find((p) => {
    const mod = Array.isArray(p.modulos_capacitacion) ? p.modulos_capacitacion[0] : p.modulos_capacitacion
    return (mod as { tipo: string } | null)?.tipo === 'evaluacion' && (p.puntaje ?? 0) >= 80
  })

  if (!evalCompletada?.fecha_completado) {
    return { vigente: false, fechaObtencion: null, fechaVencimiento: null, diasRestantes: null, proximaAVencer: false }
  }

  const fechaObtencion   = new Date(evalCompletada.fecha_completado)
  const fechaVencimiento = new Date(fechaObtencion)
  fechaVencimiento.setDate(fechaVencimiento.getDate() + DIAS_VIGENCIA_CERT)

  const diasRestantes = Math.floor((fechaVencimiento.getTime() - Date.now()) / 86400000)

  return {
    vigente:         diasRestantes > 0,
    fechaObtencion:  fechaObtencion.toISOString(),
    fechaVencimiento: fechaVencimiento.toISOString(),
    diasRestantes,
    proximaAVencer:  diasRestantes >= 0 && diasRestantes <= DIAS_AVISO_VENCIMIENTO,
  }
}

export async function verificarCertificacionesVenciendo(): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const limiteAviso  = new Date(); limiteAviso.setDate(limiteAviso.getDate() + DIAS_AVISO_VENCIMIENTO)
  const limiteVencimiento = new Date(Date.now())

  // Buscar evaluaciones completadas cuyo vencimiento cae en los próximos 30 días o ya venció
  const fechaCorte = new Date(); fechaCorte.setDate(fechaCorte.getDate() - (DIAS_VIGENCIA_CERT - DIAS_AVISO_VENCIMIENTO))

  const { data: progresos } = await supabase
    .from('progreso_capacitacion')
    .select('usuario_id, fecha_completado, puntaje, modulos_capacitacion(tipo), usuarios(nombre, centro_id)')
    .eq('completado', true)
    .gte('fecha_completado', new Date(Date.now() - DIAS_VIGENCIA_CERT * 86400000).toISOString())
    .lte('fecha_completado', fechaCorte.toISOString())

  if (!progresos) return

  for (const p of progresos) {
    const mod = Array.isArray(p.modulos_capacitacion) ? p.modulos_capacitacion[0] : p.modulos_capacitacion
    if ((mod as { tipo: string } | null)?.tipo !== 'evaluacion') continue
    if ((p.puntaje ?? 0) < 80) continue

    const usuario  = Array.isArray(p.usuarios) ? p.usuarios[0] : p.usuarios as { nombre: string; centro_id: string } | null
    if (!usuario?.centro_id) continue

    const fechaVence = new Date(p.fecha_completado)
    fechaVence.setDate(fechaVence.getDate() + DIAS_VIGENCIA_CERT)
    const diasRestantes = Math.floor((fechaVence.getTime() - Date.now()) / 86400000)

    if (diasRestantes > DIAS_AVISO_VENCIMIENTO) continue

    // Verificar si ya existe novedad activa de certificación para este usuario/centro
    const { data: existente } = await supabase
      .from('novedades')
      .select('id')
      .eq('centro_id', usuario.centro_id)
      .eq('tipo', 'capacitacion')
      .in('estado', ['abierta', 'en_gestion'])
      .ilike('titulo', `%${usuario.nombre}%`)
      .maybeSingle()

    if (existente) continue

    const nivel = diasRestantes <= 0 ? 'alto' : diasRestantes <= 7 ? 'medio' : 'bajo'
    const titulo = diasRestantes <= 0
      ? `Certificación vencida: ${usuario.nombre}`
      : `Certificación por vencer: ${usuario.nombre}`
    const descripcion = diasRestantes <= 0
      ? `La certificación EMC de ${usuario.nombre} venció hace ${Math.abs(diasRestantes)} días. Debe renovar el módulo de evaluación.`
      : `La certificación EMC de ${usuario.nombre} vence en ${diasRestantes} días (${fechaVence.toLocaleDateString('es-CO')}).`

    await supabase.from('novedades').insert({
      tipo:        'capacitacion',
      nivel,
      titulo,
      descripcion,
      centro_id:   usuario.centro_id,
      responsable: 'TQ Nacional',
      sla_dias:    diasRestantes <= 0 ? 3 : 14,
      estado:      'abierta',
    })
  }

  revalidatePath('/tq')
}

export async function obtenerNovedades(): Promise<{
  id: string
  tipo: string
  nivel: string
  titulo: string
  descripcion: string
  centro: string
  responsable: string
  sla_dias: number
  estado: string
  created_at: string
}[]> {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('novedades')
    .select('*, centros(nombre)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((n) => ({
    id:          n.id,
    tipo:        n.tipo,
    nivel:       n.nivel,
    titulo:      n.titulo,
    descripcion: n.descripcion ?? '',
    centro:      (n.centros as { nombre: string } | null)?.nombre ?? '—',
    responsable: n.responsable ?? '—',
    sla_dias:    n.sla_dias ?? 7,
    estado:      n.estado,
    created_at:  n.created_at,
  }))
}

export async function actualizarEstadoNovedad(
  id: string,
  estado: 'abierta' | 'en_gestion' | 'cerrada'
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('novedades')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/tq')
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
