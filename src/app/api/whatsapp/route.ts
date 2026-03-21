// Webhook de WhatsApp Business (Meta Cloud API)
//
// GET  — verificación del webhook (Meta envía hub.challenge)
// POST — mensajes entrantes de pacientes (chatbot)
//
// Configuración en Meta for Developers:
//   Webhook URL:    https://tu-dominio.vercel.app/api/whatsapp
//   Verify Token:   valor de WHATSAPP_VERIFY_TOKEN en tus env vars
//   Suscribirse a: messages

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  enviarTexto,
  mensajeBienvenida,
  mensajeProcedimientoEncontrado,
  mensajeProcedimientoNoEncontrado,
} from '@/lib/whatsapp'

// ---- GET: verificación del webhook ----
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ---- POST: mensajes entrantes ----
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Extraer el primer mensaje del payload de Meta
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!message || message.type !== 'text') {
      return NextResponse.json({ status: 'ok' })
    }

    const from = message.from as string               // número en formato internacional (ej. 573001234567)
    const text = (message.text?.body as string ?? '').trim()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enfoque360.vercel.app'

    // Si el mensaje parece una cédula (7–12 dígitos), buscamos el procedimiento
    const cedula = text.replace(/[\.\s\-]/g, '')
    const esCedula = /^\d{7,12}$/.test(cedula)

    if (esCedula) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: pac } = await supabase
        .from('pacientes')
        .select('id, nombre')
        .eq('cedula', cedula)
        .maybeSingle()

      if (!pac) {
        await enviarTexto(from, mensajeProcedimientoNoEncontrado())
        return NextResponse.json({ status: 'ok' })
      }

      const { data: proc } = await supabase
        .from('procedimientos')
        .select('fecha')
        .eq('paciente_id', pac.id)
        .eq('estado', 'programado')
        .gte('fecha', new Date().toISOString())
        .order('fecha', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!proc) {
        await enviarTexto(from, mensajeProcedimientoNoEncontrado())
        return NextResponse.json({ status: 'ok' })
      }

      await enviarTexto(from, mensajeProcedimientoEncontrado(pac.nombre, proc.fecha, baseUrl))
    } else {
      // Cualquier otro mensaje → menú de bienvenida
      await enviarTexto(from, mensajeBienvenida())
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    // Siempre devolver 200 a Meta para evitar reintentos
    console.error('[WhatsApp webhook]', err)
    return NextResponse.json({ status: 'ok' })
  }
}
