'use client'

import { useState } from 'react'
import { LogOut, Menu, X, MapPin, Building2, BarChart3, Table2, Bell, DollarSign, GraduationCap } from 'lucide-react'
import type { ReactNode } from 'react'

export type TabFase =
  | 'centros_activos'
  | 'otros_centros'
  | 'performance'
  | 'analisis'
  | 'novedades'
  | 'inversion'
  | 'capacitaciones'

interface ItemDef {
  id: TabFase
  label: string
  icon: ReactNode
  disabled?: boolean
}

const ITEMS_VISITADOR: ItemDef[] = [
  { id: 'centros_activos', label: 'Centros activos',  icon: <MapPin className="w-4 h-4" /> },
  { id: 'otros_centros',   label: 'Otros centros',    icon: <Building2 className="w-4 h-4" /> },
  { id: 'performance',     label: 'Performance',      icon: <BarChart3 className="w-4 h-4" />, disabled: true },
  { id: 'analisis',        label: 'Análisis',         icon: <Table2 className="w-4 h-4" />,    disabled: true },
  { id: 'novedades',       label: 'Novedades',        icon: <Bell className="w-4 h-4" /> },
  { id: 'inversion',       label: 'Inversión',        icon: <DollarSign className="w-4 h-4" />, disabled: true },
  { id: 'capacitaciones',  label: 'Capacitaciones',   icon: <GraduationCap className="w-4 h-4" />, disabled: true },
]

interface Props {
  tab: TabFase
  onTab: (t: TabFase) => void
  nombre: string
  rolLabel: string
  /** Si true muestra ítems extras y oculta los “disabled” como solo informativos */
  variante?: 'visitador' | 'gerente'
}

export function SidebarFase({ tab, onTab, nombre, rolLabel, variante = 'visitador' }: Props) {
  const [open, setOpen] = useState(false)
  const items = ITEMS_VISITADOR

  return (
    <>
      {/* Top bar mobile */}
      <header className="lg:hidden bg-navy text-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="p-2 -ml-2 rounded-lg hover:bg-white/10">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center font-bold text-xs">E</div>
          <span className="font-semibold text-sm">Enfoque 360</span>
        </div>
        <form action="/auth/signout" method="POST">
          <button title="Cerrar sesión" className="p-2 -mr-2 rounded-lg hover:bg-white/10">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </header>

      {/* Backdrop mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-screen lg:h-auto lg:min-h-screen
          w-72 bg-navy text-white z-50
          transform transition-transform duration-200 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header del sidebar */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center font-bold">E</div>
            <div>
              <h1 className="font-semibold text-sm leading-tight">Enfoque 360</h1>
              <p className="text-[11px] text-white/50 leading-tight capitalize">{rolLabel}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Usuario */}
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-medium leading-tight truncate">{nombre}</p>
          <p className="text-[11px] text-white/50">{variante === 'gerente' ? 'Gerente · Vista nacional' : 'Promotor visitador'}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const active = tab === it.id
            return (
              <button
                key={it.id}
                disabled={it.disabled}
                onClick={() => {
                  if (it.disabled) return
                  onTab(it.id)
                  setOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left
                  ${active
                    ? 'bg-teal text-white shadow-sm'
                    : it.disabled
                      ? 'text-white/30 cursor-not-allowed'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}
                `}
              >
                {it.icon}
                <span className="flex-1">{it.label}</span>
                {it.disabled && (
                  <span className="text-[10px] uppercase tracking-wide opacity-60">próx.</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sign out desktop */}
        <div className="hidden lg:block border-t border-white/10 p-4">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
