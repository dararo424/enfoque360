import { redirect } from 'next/navigation'
import { getUsuario, createServerSupabaseClient } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { Stethoscope, CheckCircle2, Target, TrendingUp, Download } from 'lucide-react'
import { MedicoChart } from './MedicoCharts'

// ---- Datos demo ----
const DEMO_TENDENCIA = [
  { mes: 'Oct', prepAdecuada: 84, deteccionAdenomas: 33 },
  { mes: 'Nov', prepAdecuada: 86, deteccionAdenomas: 35 },
  { mes: 'Dic', prepAdecuada: 85, deteccionAdenomas: 34 },
  { mes: 'Ene', prepAdecuada: 87, deteccionAdenomas: 36 },
  { mes: 'Feb', prepAdecuada: 88, deteccionAdenomas: 37 },
  { mes: 'Mar', prepAdecuada: 89, deteccionAdenomas: 38 },
]

const DEMO_PROCEDIMIENTOS = [
  { id: '1', paciente: 'Luis Torres Pérez',     cedula: '74.829.301', fecha: '2026-03-18', producto: 'COLONLYTELY', estado: 'completado', prep: 'excelente' },
  { id: '2', paciente: 'Sandra Ríos Cardona',   cedula: '52.631.204', fecha: '2026-03-17', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'buena' },
  { id: '3', paciente: 'Felipe Mora Agudelo',   cedula: '1.098.345',  fecha: '2026-03-17', producto: 'COLONLYTELY', estado: 'completado', prep: 'regular' },
  { id: '4', paciente: 'Diana Zuluaga Gómez',   cedula: '43.812.760', fecha: '2026-03-16', producto: 'NULYTELY',    estado: 'completado', prep: 'buena' },
  { id: '5', paciente: 'Andrés Patiño López',   cedula: '80.127.543', fecha: '2026-03-15', producto: 'TRAVAD PIK',  estado: 'completado', prep: 'inadecuada' },
]

const PREP_BADGE: Record<string, string> = {
  excelente:  'bg-green-100 text-green-700',
  buena:      'bg-blue-100 text-blue-700',
  regular:    'bg-yellow-100 text-yellow-700',
  inadecuada: 'bg-red-100 text-red-600',
}
const PREP_LABEL: Record<string, string> = {
  excelente: 'Excelente', buena: 'Buena', regular: 'Adecuada', inadecuada: 'Inadecuada',
}

export default async function MedicoPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'medico' && usuario.rol !== 'admin') redirect('/login')

  // Intenta cargar datos reales, usa demo si no hay
  let procedimientos = DEMO_PROCEDIMIENTOS
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('procedimientos')
      .select('*, pacientes(nombre, cedula)')
      .eq('medico_id', usuario.id)
      .order('fecha', { ascending: false })
      .limit(5)
    if (data && data.length > 0) {
      procedimientos = data.map((p) => ({
        id: p.id,
        paciente: (p.pacientes as { nombre: string })?.nombre ?? '—',
        cedula: (p.pacientes as { cedula: string })?.cedula ?? '',
        fecha: new Date(p.fecha).toLocaleDateString('es-CO'),
        producto: p.producto,
        estado: p.estado,
        prep: (p.indicadores as Record<string, string>)?.preparacion ?? '',
      }))
    }
  } catch { /* usa demo */ }

  const mesActual = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        subtitulo={usuario.centros?.nombre ?? 'Centro'}
        nombre={usuario.nombre}
        rol="Médico"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title + descarga */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h2 className="text-xl font-bold text-navy">Panel Médico</h2>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{mesActual} · {usuario.centros?.nombre ?? 'Centro'}</p>
          </div>
          <button className="hidden sm:flex items-center gap-2 text-xs font-semibold text-navy border border-navy/20 hover:bg-navy/5 transition-colors px-4 py-2 rounded-xl">
            <Download className="w-3.5 h-3.5" />
            Descargar informe
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Stethoscope className="w-5 h-5" />,  label: 'Procedimientos',       value: '47',  sub: 'Acumulado histórico',      theme: 'teal'   as const },
            { icon: <CheckCircle2 className="w-5 h-5" />, label: '% Prep. adecuada',     value: '89%', sub: 'Promedio últimos 6 meses',  theme: 'green'  as const },
            { icon: <Target className="w-5 h-5" />,       label: 'Detección adenomas',   value: '38%', sub: 'Meta ASGE: >25%  ✓',        theme: 'purple' as const },
            { icon: <TrendingUp className="w-5 h-5" />,   label: 'Intubación cecal',     value: '96%', sub: 'Meta: >90%  ✓',             theme: 'navy'   as const },
          ].map((k) => <MedicoKpiCard key={k.label} {...k} />)}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-navy">Mis indicadores · últimos 6 meses</h3>
              <p className="text-xs text-gray-400 mt-0.5">Preparación adecuada vs. detección de adenomas</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-3 mb-4">
            <LegendItem color="#0CA5A0" label="Prep. adecuada" />
            <LegendItem color="#0F2D52" label="Detección adenomas" dashed />
          </div>
          <MedicoChart data={DEMO_TENDENCIA} />
        </div>

        {/* Últimos procedimientos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-navy">Últimos procedimientos</h3>
              <p className="text-xs text-gray-400 mt-0.5">5 más recientes</p>
            </div>
            <button className="sm:hidden flex items-center gap-1.5 text-xs font-medium text-navy/60 hover:text-navy transition-colors">
              <Download className="w-3.5 h-3.5" />
              Informe
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Paciente', 'Fecha', 'Producto', 'Preparación', 'Estado'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {procedimientos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{p.paciente}</p>
                      <p className="text-xs text-gray-400">{p.cedula}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{p.fecha}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-navy/70 bg-navy/5 px-2 py-1 rounded-lg">{p.producto}</span>
                    </td>
                    <td className="px-6 py-4">
                      {p.prep && PREP_BADGE[p.prep] ? (
                        <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${PREP_BADGE[p.prep]}`}>
                          {PREP_LABEL[p.prep]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {p.estado === 'completado' ? 'Completado' : p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

// ---- Helpers visuales ----
type Theme = 'teal' | 'navy' | 'green' | 'purple'

function MedicoKpiCard({ icon, label, value, sub, theme }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  theme: Theme
}) {
  const themes: Record<Theme, { bg: string; icon: string }> = {
    teal:   { bg: 'bg-teal-light', icon: 'text-teal' },
    navy:   { bg: 'bg-navy/5',     icon: 'text-navy' },
    green:  { bg: 'bg-green-50',   icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50',  icon: 'text-purple-600' },
  }
  const t = themes[theme]
  return (
    <div className={`${t.bg} rounded-2xl p-5`}>
      <div className={`${t.icon} mb-3`}>{icon}</div>
      <p className="text-3xl font-bold text-navy">{value}</p>
      <p className="text-sm text-gray-600 mt-1 leading-tight">{label}</p>
      <p className="text-xs text-gray-400 mt-1 leading-tight">{sub}</p>
    </div>
  )
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-6 h-0.5 rounded-full" style={{ backgroundColor: color }}>
        {dashed && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="w-full h-full" style={{
              background: `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 6px)`,
            }} />
          </div>
        )}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
