import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

// ---- Tipos de dominio ----
export type Rol =
  | 'paciente'
  | 'enfermera'
  | 'medico'
  | 'admin'
  | 'usuario_centro'
  | 'visitador'
  | 'gerente'

export interface Centro {
  id: string
  nombre: string
  ciudad: string
  regional: string
}

// ---- Fase -1: programa de visitas a centros de colonoscopia ----
export interface CentroPrograma {
  id: string
  nombre: string
  ciudad: string | null
  regional: string | null
  incluido_en_programa: boolean
  created_at?: string
}

export interface TopMedico {
  nombre: string
  pct: number
  lider?: boolean
}

export interface HistorialVisita {
  fecha: string
  procedimientos?: number
  notas?: string
}

export interface Visita {
  id: string
  visitador_id: string | null
  centro_id: string | null
  fecha: string
  estado: 'pendiente' | 'en_curso' | 'completa'
  medico_lider: string | null
  procedimientos_mes: number
  travad_pik_pct: number
  travad_colonpeg_pct: number
  otros_pct: number
  top_medicos: TopMedico[]
  historial: HistorialVisita[]
  visitas_anio: number
  centros_programa?: CentroPrograma
}

export interface NovedadFase {
  id: string
  codigo: string | null
  fecha: string | null
  descripcion: string
  tipo: string         // 'Calidad' | 'Variación Producto' | 'Datos' | 'Clínica' (+ legacy)
  centro_id: string | null
  centro_programa_id: string | null
  nivel: string        // 'Alto' | 'Medio' | 'Bajo' (+ legacy)
  responsable: string | null
  sla_dias: number
  dias_transcurridos: number
  estado: string       // 'Abierta' | 'En gestión' | 'Cerrada' (+ legacy)
  titulo: string | null
  created_at?: string
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
