// WhatsApp Business Cloud API — Meta
// Env vars requeridas:
//   WHATSAPP_PHONE_NUMBER_ID  — ID del número en Meta Business
//   WHATSAPP_ACCESS_TOKEN     — Token de acceso permanente
//   WHATSAPP_VERIFY_TOKEN     — Token arbitrario para verificar webhook
//   NEXT_PUBLIC_APP_URL       — URL base de la app (ej. https://enfoque360.vercel.app)

const API_VERSION = 'v19.0'
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`

/** Normaliza un número colombiano a formato internacional sin '+' */
export function normalizarTelefono(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length >= 12) return digits
  if (digits.startsWith('3') && digits.length === 10) return `57${digits}`
  return digits
}

/** Envía un mensaje de texto simple a un número de WhatsApp */
export async function enviarTexto(to: string, body: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !token) {
    console.warn('[WhatsApp] Credenciales no configuradas — mensaje no enviado')
    return
  }

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizarTelefono(to),
      type: 'text',
      text: { body },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[WhatsApp] Error al enviar mensaje:', err)
    throw new Error(`WhatsApp API error: ${res.status}`)
  }
}

// ----------------------------------------------------------------
// Mensajes predefinidos
// ----------------------------------------------------------------

export function mensajeBienvenida(): string {
  return `👋 Hola, soy el asistente de *Enfoque 360 · Tecnoquímicas*.

Puedo ayudarte con:
1️⃣ Consultar tu colonoscopia programada
2️⃣ Acceder al registro de preparación
3️⃣ Ver instrucciones de preparación

*Envía tu número de cédula* (solo números) para comenzar.`
}

export function mensajeProcedimientoEncontrado(
  nombre: string,
  fecha: string,
  baseUrl: string
): string {
  const d = new Date(fecha)
  const fechaFmt = d.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const horaFmt = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return `✅ *Procedimiento encontrado*

👤 ${nombre}
📅 ${fechaFmt}
🕐 ${horaFmt}

Para registrar tu preparación ingresa aquí:
👉 ${baseUrl}/paciente

¿Tienes dudas? Escríbenos o llama al centro médico.

_Enfoque 360 · Tecnoquímicas_`
}

export function mensajeProcedimientoNoEncontrado(): string {
  return `❌ No encontramos procedimientos programados para esa cédula.

Si crees que es un error, contacta al centro médico donde tienes programada tu colonoscopia.

_Enfoque 360 · Tecnoquímicas_`
}

export function mensajeRecordatorio(
  nombre: string,
  fecha: string,
  diasRestantes: number,
  baseUrl: string
): string {
  const d = new Date(fecha)
  const fechaFmt = d.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const horaFmt = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const encabezado = diasRestantes <= 1
    ? '🏥 *¡Tu colonoscopia es mañana!*'
    : `🏥 *Tu colonoscopia es en ${diasRestantes} días*`

  return `${encabezado}

📅 ${fechaFmt} a las ${horaFmt}

Hola *${nombre}*, este es un recordatorio de tu procedimiento.

✅ ¿Ya registraste tu preparación?
👉 ${baseUrl}/paciente

💊 Recuerda seguir las instrucciones de preparación de tu médico.
🚫 Ayuno desde la noche anterior.
💧 Solo líquidos claros permitidos.

---
_Enfoque 360 · Tecnoquímicas_`
}
