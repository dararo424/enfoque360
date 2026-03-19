import { LogOut } from 'lucide-react'

interface Props {
  subtitulo?: string
  nombre?: string
  rol?: string
}

export function AppHeader({ subtitulo, nombre, rol }: Props) {
  return (
    <header className="bg-navy text-white px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center font-bold text-sm select-none">
          E
        </div>
        <div>
          <h1 className="font-semibold text-sm leading-tight">Enfoque 360</h1>
          {subtitulo && <p className="text-xs text-white/60 leading-tight">{subtitulo}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {nombre && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-tight">{nombre}</p>
            {rol && <p className="text-xs text-white/50 capitalize leading-tight">{rol}</p>}
          </div>
        )}
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            title="Cerrar sesión"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  )
}
