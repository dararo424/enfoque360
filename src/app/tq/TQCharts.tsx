'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const TEAL  = '#0CA5A0'
const NAVY  = '#0F2D52'
const SLATE = '#64748b'

interface TendenciaPoint { mes: string; pct: number }
interface ProductoPoint  { nombre: string; valor: number }

// ---- Tooltip personalizado ----
function CustomTooltipLine({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-base font-bold text-navy">{payload[0].value}%</p>
      <p className="text-xs text-gray-400">Prep. adecuada</p>
    </div>
  )
}

function CustomTooltipPie({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-navy">{payload[0].name}</p>
      <p className="text-xl font-bold" style={{ color: TEAL }}>{payload[0].value}%</p>
    </div>
  )
}

// ---- Gráfica de tendencia ----
export function TendenciaChart({ data }: { data: TendenciaPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={TEAL} stopOpacity={0.15} />
            <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<CustomTooltipLine />} />
        <Area
          type="monotone"
          dataKey="pct"
          stroke={TEAL}
          strokeWidth={2.5}
          fill="url(#gradTeal)"
          dot={{ fill: TEAL, strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: TEAL, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---- Gráfica de dona ----
const PRODUCTO_COLORS = [TEAL, NAVY, SLATE]

export function ProductosChart({ data }: { data: ProductoPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          dataKey="valor"
          nameKey="nombre"
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PRODUCTO_COLORS[i % PRODUCTO_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltipPie />} />
        <Legend
          formatter={(value) => <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
