import { redirect } from 'next/navigation'
import { getUsuario } from '@/lib/supabase-server'
import { AppHeader } from '@/components/AppHeader'
import { Building2, Users, CheckCircle2, Award, TrendingUp } from 'lucide-react'
import { TendenciaChart, ProductosChart } from './TQCharts'

// ---- Datos demo ----
const TENDENCIA = [
  { mes: 'Oct', pct: 78 },
  { mes: 'Nov', pct: 81 },
  { mes: 'Dic', pct: 80 },
  { mes: 'Ene', pct: 83 },
  { mes: 'Feb', pct: 85 },
  { mes: 'Mar', pct: 87 },
]

const PRODUCTOS = [
  { nombre: 'TRAVAD PIK',  valor: 45 },
  { nombre: 'COLONLYTELY', valor: 35 },
  { nombre: 'NULYTELY',    valor: 20 },
]

const CENTROS = [
  { nombre: 'Clínica Santa Fe',           ciudad: 'Bogotá',       procedimientos: 284, pct: 91 },
  { nombre: 'Hospital San Vicente Paúl',  ciudad: 'Medellín',     procedimientos: 198, pct: 88 },
  { nombre: 'Fundación Cardiovascular',   ciudad: 'Bucaramanga',  procedimientos: 156, pct: 86 },
  { nombre: 'Clínica del Country',        ciudad: 'Bogotá',       procedimientos: 143, pct: 84 },
  { nombre: 'Centro Médico Imbanaco',     ciudad: 'Cali',         procedimientos: 128, pct: 82 },
  { nombre: 'Clínica Medellín',           ciudad: 'Medellín',     procedimientos: 117, pct: 81 },
  { nombre: 'Hospital Universitario',     ciudad: 'Manizales',    procedimientos:  98, pct: 79 },
]

function pctColor(pct: number) {
  if (pct >= 85) return 'text-green-600 bg-green-50'
  if (pct >= 75) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export default async function TQPage() {
  const usuario = await getUsuario()
  if (!usuario) redirect('/login')
  if (usuario.rol !== 'admin') redirect('/login')

  const mesActual = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader subtitulo="Panel Tecnoquímicas · Nacional" nombre={usuario.nombre} rol="Administrador TQ" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h2 className="text-xl font-bold text-navy">Panel Tecnoquímicas</h2>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">Vista agregada nacional · {mesActual}</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium bg-teal/10 text-teal px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            14 centros activos
          </span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Building2 className="w-5 h-5" />,
              label: 'Centros activos',
              value: '14',
              sub: 'En 8 ciudades',
              theme: 'teal' as const,
            },
            {
              icon: <Users className="w-5 h-5" />,
              label: 'Procedimientos del mes',
              value: '1.247',
              sub: '+12% vs mes anterior',
              theme: 'navy' as const,
            },
            {
              icon: <CheckCircle2 className="w-5 h-5" />,
              label: '% Preparación adecuada',
              value: '87%',
              sub: 'Meta: 85%  ✓',
              theme: 'green' as const,
            },
            {
              icon: <Award className="w-5 h-5" />,
              label: 'Médicos con EMC',
              value: '23',
              sub: 'Educación médica continua',
              theme: 'purple' as const,
            },
          ].map((k) => <TQKpiCard key={k.label} {...k} />)}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-sm font-semibold text-navy">Tendencia preparación adecuada</h3>
                <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses · nacional</p>
              </div>
              <TrendingUp className="w-4 h-4 text-teal mt-0.5" />
            </div>
            <TendenciaChart data={TENDENCIA} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-1">
              <h3 className="text-sm font-semibold text-navy">Distribución de productos</h3>
              <p className="text-xs text-gray-400 mt-0.5">Participación por preparación</p>
            </div>
            <ProductosChart data={PRODUCTOS} />
          </div>
        </div>

        {/* Tabla de centros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-navy">Desempeño por centro</h3>
              <p className="text-xs text-gray-400 mt-0.5">{CENTROS.length} centros · mes actual</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Centro', 'Ciudad', 'Procedimientos', '% Prep. adecuada', 'Progreso'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {CENTROS.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{c.nombre}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{c.ciudad}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{c.procedimientos.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${pctColor(c.pct)}`}>
                        {c.pct}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${c.pct}%`,
                              backgroundColor: c.pct >= 85 ? '#0CA5A0' : c.pct >= 75 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{c.pct}%</span>
                      </div>
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

// ---- KPI Card ----
type Theme = 'teal' | 'navy' | 'green' | 'purple'

function TQKpiCard({
  icon, label, value, sub, theme,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  theme: Theme
}) {
  const themes: Record<Theme, { bg: string; icon: string }> = {
    teal:   { bg: 'bg-teal-light',  icon: 'text-teal' },
    navy:   { bg: 'bg-navy/5',      icon: 'text-navy' },
    green:  { bg: 'bg-green-50',    icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50',   icon: 'text-purple-600' },
  }
  const t = themes[theme]
  return (
    <div className={`${t.bg} rounded-2xl p-5`}>
      <div className={`${t.icon} mb-3`}>{icon}</div>
      <p className="text-3xl font-bold text-navy">{value}</p>
      <p className="text-sm text-gray-600 mt-1 leading-tight">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}
