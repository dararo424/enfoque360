'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts'

const TEAL  = '#0CA5A0'
const NAVY  = '#0F2D52'
const COLORS = [TEAL, NAVY, '#6366f1', '#f59e0b', '#10b981']

// ---- Shared Tooltip ----
function Tip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      {label && <p className="text-xs text-gray-500 mb-2 font-medium">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600 text-xs">{p.name}:</span>
          <span className="font-bold text-navy text-xs">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

// ---- Tendencia (AreaChart) ----
export interface TendenciaPoint { mes: string; prepAdecuada: number; deteccionAdenomas: number; reprocesos: number }

export function MedicoChart({ data }: { data: TendenciaPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPrep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={TEAL}    stopOpacity={0.15} />
            <stop offset="95%" stopColor={TEAL}    stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradRep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<Tip />} />
        <Area type="monotone" dataKey="prepAdecuada"     name="Prep. adecuada" stroke={TEAL}    strokeWidth={2.5} fill="url(#gradPrep)"
          dot={{ fill: TEAL, strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: TEAL, stroke: '#fff', strokeWidth: 2 }} />
        <Area type="monotone" dataKey="reprocesos"        name="% Reprocesos"        stroke="#ef4444" strokeWidth={2}   fill="url(#gradRep)"
          strokeDasharray="4 2" dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} />
        <Area type="monotone" dataKey="deteccionAdenomas" name="Detección adenomas"  stroke="#6366f1" strokeWidth={2}   fill="none"
          strokeDasharray="6 3" dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---- Distribución por producto (PieChart donut) ----
export interface ProductoPoint { producto: string; cantidad: number }

function PieTip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-xs font-medium text-gray-700">{p.name}</p>
      <p className="text-lg font-bold text-navy">{p.value}</p>
      <p className="text-xs text-gray-400">procedimientos</p>
    </div>
  )
}

export function ProductoChart({ data }: { data: ProductoPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="cantidad" nameKey="producto" cx="50%" cy="50%"
          innerRadius={55} outerRadius={85} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<PieTip />} />
        <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ---- Procedimientos por hora (BarChart) ----
export interface HoraPoint { hora: string; total: number }

function BarTip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-xs text-gray-500 mb-1">{label}h</p>
      <p className="font-bold text-navy">{payload[0].value} proc.</p>
    </div>
  )
}

export function HoraChart({ data }: { data: HoraPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<BarTip />} />
        <Bar dataKey="total" name="Procedimientos" fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
