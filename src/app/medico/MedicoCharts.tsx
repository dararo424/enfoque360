'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const TEAL = '#0CA5A0'

interface DataPoint { mes: string; prepAdecuada: number; deteccionAdenomas: number }

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-xs text-gray-500 mb-2 font-medium">{label}</p>
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

export function MedicoChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPrep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={TEAL}    stopOpacity={0.15} />
            <stop offset="95%" stopColor={TEAL}    stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAdeno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0F2D52" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#0F2D52" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="prepAdecuada"
          name="Prep. adecuada"
          stroke={TEAL}
          strokeWidth={2.5}
          fill="url(#gradPrep)"
          dot={{ fill: TEAL, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: TEAL, stroke: '#fff', strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="deteccionAdenomas"
          name="Detección adenomas"
          stroke="#0F2D52"
          strokeWidth={2}
          fill="url(#gradAdeno)"
          strokeDasharray="4 2"
          dot={{ fill: '#0F2D52', strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: '#0F2D52', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
