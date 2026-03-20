import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Rol } from '@/lib/supabase'

const ROL_RUTAS: Record<Rol, string> = {
  paciente: '/paciente',
  enfermera: '/enfermeria',
  medico: '/medico',
  admin: '/tq',
}

// Rutas que no requieren autenticación
const RUTAS_PUBLICAS = ['/login', '/auth/callback', '/auth/signout']

// Rutas accesibles para admin además de /tq
const RUTAS_ADMIN_EXTRA = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Pasar por rutas públicas sin verificar
  if (RUTAS_PUBLICAS.some((r) => pathname.startsWith(r))) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // No autenticado → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Obtener rol del usuario
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const rol = (usuario as { rol: Rol } | null)?.rol

  // Raíz → redirigir a la ruta del rol
  if (pathname === '/') {
    const destino = rol ? ROL_RUTAS[rol] : '/login'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // Verificar que el usuario solo acceda a su sección
  if (rol) {
    const rutaRol = ROL_RUTAS[rol]

    // Admin puede acceder también a /admin además de /tq
    if (rol === 'admin' && RUTAS_ADMIN_EXTRA.some((r) => pathname.startsWith(r))) {
      return response
    }

    const otrasRutas = Object.values(ROL_RUTAS).filter((r) => r !== rutaRol)
    if (otrasRutas.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL(rutaRol, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
