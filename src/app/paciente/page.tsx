import { redirect } from 'next/navigation'
import { getUsuario } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { FormularioPaciente } from './FormularioPaciente'
import { PacientePreCita } from './PacientePreCita'
import { obtenerProximoProcedimientoPaciente } from '@/lib/actions'

// Demo procedure shown when no real one is found (3 days from now at 08:30)
function fechaDemoProc(): string {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  d.setHours(8, 30, 0, 0)
  return d.toISOString()
}

export default async function PacientePage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'paciente' && usuario.rol !== 'admin') redirect('/login')

  const proximoProc = await obtenerProximoProcedimientoPaciente()

  // Use real data if available, otherwise show demo so the feature is always visible
  const precitaProps = proximoProc
    ? { fechaProcedimiento: proximoProc.fecha, protocolo: { confirmado: proximoProc.protocolo_confirmado, archivoUrl: proximoProc.archivo_url }, procedimientoId: proximoProc.id }
    : { fechaProcedimiento: fechaDemoProc(), protocolo: { confirmado: false, archivoUrl: null }, procedimientoId: 'demo' }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader subtitulo="Portal del Paciente" nombre={usuario.nombre} />

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-navy">Mi colonoscopia</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Recordatorios, preparación y registro
          </p>
        </div>

        <PacientePreCita {...precitaProps} />

        <div className="mb-5">
          <h3 className="text-base font-bold text-navy">Registro de preparación</h3>
          <p className="text-sm text-gray-500 mt-0.5">Completa el formulario el día de tu colonoscopia</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <FormularioPaciente />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Enfoque 360 · Tecnoquímicas · Información confidencial
        </p>
      </main>
    </div>
  )
}
