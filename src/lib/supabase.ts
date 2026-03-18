import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

// ---- Tipos de dominio ----
export type Rol = 'paciente' | 'enfermera' | 'medico' | 'admin'

export interface Centro {
  id: string
  nombre: string
  ciudad: string
  regional: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: Rol
  centro_id: string | null
  centros?: Centro
}

export interface Paciente {
  id: string
  nombre: string
  cedula: string
  edad: number
  centro_id: string
  usuario_id: string | null
  preparacion: Record<string, unknown>
}

export interface Procedimiento {
  id: string
  paciente_id: string
  enfermera_id: string | null
  medico_id: string | null
  centro_id: string
  fecha: string
  producto: string
  estado: 'programado' | 'en_curso' | 'completado' | 'cancelado'
  indicadores: Record<string, unknown>
  notas: string | null
  pacientes?: Paciente
  enfermera?: Usuario
  medico?: Usuario
}

export type Database = {
  public: {
    Tables: {
      centros: { Row: Centro }
      usuarios: { Row: Usuario }
      pacientes: { Row: Paciente }
      procedimientos: { Row: Procedimiento }
    }
  }
}

// ---- Cliente para componentes del navegador (Client Components) ----
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
