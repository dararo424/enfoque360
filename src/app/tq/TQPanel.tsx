'use client'

import { useState } from 'react'
import { LayoutDashboard, BarChart3, Table2, Bell, DollarSign, GraduationCap } from 'lucide-react'
import { Building2, Users, CheckCircle2, Award } from 'lucide-react'
import { TendenciaChart, ProductosChart } from './TQCharts'
import { TQPerformance } from './TQPerformance'
import { TQAnalisis } from './TQAnalisis'
import { TQNovedades } from './TQNovedades'
import { TQInversion } from './TQInversion'
import { TQCapacitaciones } from './TQCapacitaciones'

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

const TABS = [
  { id: 'inicio',          label: 'Inicio',         icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'performance',     label: 'Performance',    icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'analisis',        label: 'Análisis',       icon: <Table2 className="w-4 h-4" /> },
  { id: 'novedades',       label: 'Novedades',      icon: <Bell className="w-4 h-4" /> },
  { id: 'inversion',       label: 'Inversión EMC',  icon: <DollarSign className="w-4 h-4" /> },
  { id: 'capacitaciones',  label: 'Capacitaciones', icon: <GraduationCap className="w-4 h-4" /> },
]

interface Novedad {
  id: string; tipo: string; nivel: string; titulo: string; descripcion: string
  centro: string; responsable: string; sla_dias: number; estado: string; created_at: string
}

export function TQPanel({ novedadesIniciales = [] }: { novedadesIniciales?: Novedad[] }) {
  const [tab, setTab] = useState('inicio')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-teal text-white shadow-sm'
                : 'text-gray-500 hover:text-navy hover:bg-gray-50'
            }`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'inicio' && <TQInicio novedadesAbiertas={novedadesIniciales.filter((n) => n.estado === 'abierta').length} />}
      {tab === 'performance'    && <TQPerformance />}
      {tab === 'analisis'       && <TQAnalisis />}
      {tab === 'novedades'      && <TQNovedades novedadesIniciales={novedadesIniciales} />}
      {tab === 'inversion'      && <TQInversion />}
      {tab === 'capacitaciones' && <TQCapacitaciones />}
    </div>
  )
}

function TQInicio({ novedadesAbiertas }: { novedadesAbiertas: number }) {
  const mesActual = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Building2 className="w-5 h-5" />,  label: 'Centros activos',        value: '14',    sub: 'En 8 ciudades',              bg: 'bg-teal-light', text: 'text-teal'   },
          { icon: <Users className="w-5 h-5" />,       label: 'Procedimientos del mes', value: '1.247', sub: '+12% vs mes anterior',       bg: 'bg-navy/5',     text: 'text-navy'   },
          { icon: <CheckCircle2 className="w-5 h-5" />,label: '% Prep. adecuada',       value: '87%',   sub: 'Meta: 85%  ✓',               bg: 'bg-green-50',   text: 'text-green-600'   },
          { icon: <Award className="w-5 h-5" />,       label: 'Médicos con EMC',        value: '23',    sub: 'Educación médica continua',   bg: 'bg-purple-50',  text: 'text-purple-600'  },
        ].map((k) => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-5`}>
            <div className={`${k.text} mb-3`}>{k.icon}</div>
            <p className="text-3xl font-bold text-navy">{k.value}</p>
            <p className="text-sm text-gray-600 mt-1 leading-tight">{k.label}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-0.5">Tendencia preparación adecuada</h3>
          <p className="text-xs text-gray-400 mb-4 capitalize">Últimos 6 meses · {mesActual}</p>
          <TendenciaChart data={TENDENCIA} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-navy mb-0.5">Distribución de productos</h3>
          <p className="text-xs text-gray-400 mb-2">Participación por preparación</p>
          <ProductosChart data={PRODUCTOS} />
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: `${novedadesAbiertas || 0} alertas abiertas`,   sub: 'Ver Novedades →', color: 'border-red-200 bg-red-50/40',    text: 'text-red-700'    },
          { label: '87% prep. adecuada',   sub: 'Ver Performance →', color: 'border-teal/20 bg-teal-light',  text: 'text-teal'       },
          { label: '23 médicos EMC',        sub: 'Ver Inversión →',  color: 'border-purple-200 bg-purple-50', text: 'text-purple-700' },
          { label: '76% enfermeras cert.', sub: 'Ver Capacitaciones →', color: 'border-blue-200 bg-blue-50', text: 'text-blue-700'   },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl border p-4 ${c.color}`}>
            <p className={`text-sm font-semibold ${c.text}`}>{c.label}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
