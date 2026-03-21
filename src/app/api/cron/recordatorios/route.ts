// Cron job: envía recordatorios de WhatsApp a pacientes con procedimiento próximo
//
// Ejecuta diariamente a las 08:00 COT (13:00 UTC) vía Vercel Cron Jobs
// Env vars requeridas: SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, NEXT_PUBLIC_APP_URL
//
// Vercel protege el endpoint con Authorization: Bearer {CRON_SECRET}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarTexto, mensajeRecordatorio, normalizarTelefono } from '@/lib/whatsapp'

interface PacienteRaw {
  id: string
  nombre: string
  preparacion: Record<string, unknown> | null
}

interface ProcedimientoRaw {
  id: string
  fecha: string
  paciente_id: string
  pacientes: PacienteRaw | null
}

export async function GET(req: NextRequest) {
  // Verificar que la llamada viene de Vercel Cron (o de un admin autorizado)
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enfoque360.vercel.app'
  const now = new Date()

  const enviados: string[] = []
  const sinTelefono: string[] = []
  const errores: string[] = []

  // Enviar recordatorio a pacientes con procedimiento en 1 día y en 3 días
  for (const diasRestantes of [1, 3]) {
    const desde = new Date(now)
    desde.setDate(desde.getDate() + diasRestantes)
    desde.setHours(0, 0, 0, 0)

    const hasta = new Date(desde)
    hasta.setHours(23, 59, 59, 999)

    const { data: procedimientos, error } = await supabase
      .from('procedimientos')
      .select('id, fecha, paciente_id, pacientes(id, nombre, preparacion)')
      .eq('estado', 'programado')
      .gte('fecha', desde.toISOString())
      .lte('fecha', hasta.toISOString())

    if (error) {
      console.error(`[Cron recordatorios] Error consultando procedimientos (+${diasRestantes}d):`, error)
      continue
    }

    for (const proc of ((procedimientos ?? []) as unknown as ProcedimientoRaw[])) {
      const pac = proc.pacientes
      if (!pac) continue

      const telefono = pac.preparacion?.telefono as string | undefined
      if (!telefono) {
        sinTelefono.push(pac.nombre)
        continue
      }

      try {
        const mensaje = mensajeRecordatorio(pac.nombre, proc.fecha, diasRestantes, baseUrl)
        await enviarTexto(normalizarTelefono(telefono), mensaje)
        enviados.push(`${pac.nombre} (+${diasRestantes}d)`)
      } catch (err) {
        console.error(`[Cron recordatorios] Error enviando a ${pac.nombre}:`, err)
        errores.push(pac.nombre)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    enviados,
    sinTelefono,
    errores,
  })
}
