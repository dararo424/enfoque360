'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Building2, CalendarPlus, Plus, Edit2, Check, X, Search, ChevronDown, AlertCircle, Info } from 'lucide-react'
import {
  crearCentro,
  actualizarCentro,
  actualizarUsuario,
  buscarPacientePorCedula,
  programarProcedimiento,
} from '@/lib/actions'

// ---- Tipos ----
interface Centro   { id: string; nombre: string; ciudad: string; regional: string }
interface Usuario  { id: string; nombre: string; email: string; rol: string; centro_id: string | null; centros: { nombre: string } | null }
interface Doctor   { id: string; nombre: string }
interface Enfermera { id: string; nombre: string }

interface Props {
  centros:    Centro[]
  usuarios:   Usuario[]
  doctores:   Doctor[]
  enfermeras: Enfermera[]
}

const ROLES = ['paciente', 'enfermera', 'medico', 'admin']
const PRODUCTOS = ['TRAVAD PIK', 'COLONLYTELY', 'NULYTELY', 'OTRO']

// ---- Helpers UI ----
function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal transition-colors ${className}`} />
}

function SelectField({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal bg-white">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

function Badge({ rol }: { rol: string }) {
  const cfg: Record<string, string> = {
    admin:    'bg-purple-100 text-purple-700',
    medico:   'bg-blue-100 text-blue-700',
    enfermera:'bg-teal/10 text-teal',
    paciente: 'bg-gray-100 text-gray-600',
  }
  return <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full capitalize ${cfg[rol] ?? 'bg-gray-100 text-gray-600'}`}>{rol}</span>
}

// ================================================================
// TAB: USUARIOS
// ================================================================
function TabUsuarios({ usuarios, centros }: { usuarios: Usuario[]; centros: Centro[] }) {
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ rol: '', centro_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function startEdit(u: Usuario) {
    setEditId(u.id)
    setEditData({ rol: u.rol, centro_id: u.centro_id ?? '' })
    setError(null)
  }

  async function saveEdit() {
    if (!editId) return
    setSaving(true)
    setError(null)
    try {
      await actualizarUsuario(editId, { rol: editData.rol, centro_id: editData.centro_id || null })
      setEditId(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-navy">Usuarios registrados</h3>
          <p className="text-xs text-gray-400 mt-0.5">{usuarios.length} en total</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Para crear usuarios nuevos, usa <strong>Supabase Dashboard → Authentication</strong></span>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Nombre', 'Email', 'Rol', 'Centro', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/40">
                  <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">{u.nombre}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-5 py-3.5">
                    {editId === u.id ? (
                      <SelectField value={editData.rol} onChange={(v) => setEditData((d) => ({ ...d, rol: v }))}
                        options={ROLES.map((r) => ({ value: r, label: r }))} />
                    ) : <Badge rol={u.rol} />}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">
                    {editId === u.id ? (
                      <SelectField value={editData.centro_id}
                        onChange={(v) => setEditData((d) => ({ ...d, centro_id: v }))}
                        placeholder="Sin centro"
                        options={centros.map((c) => ({ value: c.id, label: c.nombre }))} />
                    ) : (u.centros?.nombre ?? <span className="text-gray-300">—</span>)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {editId === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={saveEdit} disabled={saving}
                          className="p-1.5 rounded-lg bg-teal/10 text-teal hover:bg-teal/20 transition-colors disabled:opacity-40">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">No hay usuarios registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// TAB: CENTROS
// ================================================================
function TabCentros({ centros }: { centros: Centro[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ nombre: '', ciudad: '', regional: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [, startT]              = useTransition()
  const router = useRouter()

  function setF(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  function startEdit(c: Centro) {
    setEditId(c.id)
    setForm({ nombre: c.nombre, ciudad: c.ciudad, regional: c.regional })
    setShowForm(true)
    setError(null)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm({ nombre: '', ciudad: '', regional: '' }); setError(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.ciudad || !form.regional) { setError('Todos los campos son requeridos'); return }
    setSaving(true); setError(null)
    try {
      if (editId) await actualizarCentro(editId, form)
      else        await crearCentro(form)
      cancelForm()
      startT(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-navy">Centros</h3>
          <p className="text-xs text-gray-400 mt-0.5">{centros.length} registrados</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-teal hover:bg-teal-dark px-3 py-2 rounded-xl transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Nuevo centro
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-teal/20 p-5 mb-4 shadow-sm">
          <h4 className="text-sm font-semibold text-navy mb-4">{editId ? 'Editar centro' : 'Nuevo centro'}</h4>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre</label>
              <Input value={form.nombre} onChange={(e) => setF('nombre', e.target.value)} placeholder="Clínica Santa Fe" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Ciudad</label>
              <Input value={form.ciudad} onChange={(e) => setF('ciudad', e.target.value)} placeholder="Bogotá" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Regional</label>
              <Input value={form.regional} onChange={(e) => setF('regional', e.target.value)} placeholder="Centro" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={cancelForm} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-teal text-white rounded-xl hover:bg-teal-dark disabled:opacity-60">
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear centro'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Nombre', 'Ciudad', 'Regional', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {centros.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/40">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.ciudad}</td>
                  <td className="px-5 py-3.5 text-gray-600">{c.regional}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => startEdit(c)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {centros.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">No hay centros registrados. Crea el primero.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// TAB: PROGRAMAR PROCEDIMIENTO
// ================================================================
function TabProgramar({ centros, doctores, enfermeras }: { centros: Centro[]; doctores: Doctor[]; enfermeras: Enfermera[] }) {
  const router = useRouter()

  const [cedula, setCedula]       = useState('')
  const [buscando, setBuscando]   = useState(false)
  const [paciente, setPaciente]   = useState<{ id: string; nombre: string; cedula: string; edad: number } | null | 'nuevo'>(null)
  const [busquedaMsg, setBMsg]    = useState('')

  const [nuevo, setNuevo]  = useState({ nombre: '', cedula: '', edad: '' })
  const [proc, setProc]    = useState({ medicoId: '', enfermeraId: '', centroId: '', fecha: '', hora: '', producto: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [exito, setExito]   = useState(false)

  function setP(k: keyof typeof proc, v: string) { setProc((f) => ({ ...f, [k]: v })) }

  async function buscar() {
    if (!cedula.trim()) return
    setBuscando(true); setBMsg(''); setPaciente(null)
    try {
      const res = await buscarPacientePorCedula(cedula)
      if (res) {
        setPaciente(res)
        setBMsg(`Paciente encontrado: ${res.nombre}`)
      } else {
        setPaciente('nuevo')
        setNuevo((n) => ({ ...n, cedula }))
        setBMsg('Paciente no encontrado. Completa los datos para registrarlo.')
      }
    } catch { setBMsg('Error en la búsqueda') }
    finally   { setBuscando(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!proc.medicoId || !proc.centroId || !proc.fecha || !proc.hora || !proc.producto) {
      setError('Completa todos los campos obligatorios'); return
    }
    if (paciente === 'nuevo' && (!nuevo.nombre || !nuevo.cedula || !nuevo.edad)) {
      setError('Completa los datos del nuevo paciente'); return
    }
    setSaving(true); setError(null)
    try {
      await programarProcedimiento({
        pacienteId:    paciente && paciente !== 'nuevo' ? paciente.id : null,
        nuevoPaciente: paciente === 'nuevo' ? { nombre: nuevo.nombre, cedula: nuevo.cedula, edad: Number(nuevo.edad) } : null,
        medicoId:      proc.medicoId,
        enfermeraId:   proc.enfermeraId || null,
        centroId:      proc.centroId,
        fecha:         `${proc.fecha}T${proc.hora}:00`,
        producto:      proc.producto,
      })
      setExito(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al programar')
    } finally { setSaving(false) }
  }

  if (exito) return (
    <div className="text-center py-12">
      <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
        <Check className="w-7 h-7 text-teal" />
      </div>
      <h3 className="text-base font-semibold text-navy mb-1">Procedimiento programado</h3>
      <p className="text-sm text-gray-500 mb-6">El procedimiento aparecerá en el panel de enfermería.</p>
      <button onClick={() => { setExito(false); setCedula(''); setPaciente(null); setProc({ medicoId: '', enfermeraId: '', centroId: '', fecha: '', hora: '', producto: '' }) }}
        className="px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition-colors">
        Programar otro
      </button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold text-navy mb-1">Programar procedimiento</h3>
        <p className="text-xs text-gray-400">Busca al paciente por cédula y completa los datos del procedimiento.</p>
      </div>

      {/* Búsqueda de paciente */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">1. Identificar paciente</p>

        <div className="flex gap-2">
          <Input value={cedula} onChange={(e) => setCedula(e.target.value)}
            placeholder="Número de cédula" className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscar())} />
          <button type="button" onClick={buscar} disabled={buscando}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors disabled:opacity-60">
            <Search className="w-3.5 h-3.5" />
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {busquedaMsg && (
          <p className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${
            paciente && paciente !== 'nuevo' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {paciente && paciente !== 'nuevo' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {busquedaMsg}
          </p>
        )}

        {/* Datos de paciente existente */}
        {paciente && paciente !== 'nuevo' && (
          <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-gray-400">Nombre</p><p className="font-medium">{paciente.nombre}</p></div>
            <div><p className="text-xs text-gray-400">Cédula</p><p className="font-medium">{paciente.cedula}</p></div>
            <div><p className="text-xs text-gray-400">Edad</p><p className="font-medium">{paciente.edad} años</p></div>
          </div>
        )}

        {/* Datos de nuevo paciente */}
        {paciente === 'nuevo' && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre completo *</label>
              <Input value={nuevo.nombre} onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))} placeholder="Nombre y apellidos" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Cédula *</label>
              <Input value={nuevo.cedula} onChange={(e) => setNuevo((n) => ({ ...n, cedula: e.target.value }))} placeholder="Sin puntos" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Edad *</label>
              <Input type="number" min={1} max={120} value={nuevo.edad} onChange={(e) => setNuevo((n) => ({ ...n, edad: e.target.value }))} placeholder="Ej. 55" />
            </div>
          </div>
        )}
      </div>

      {/* Detalles del procedimiento */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">2. Datos del procedimiento</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Médico *</label>
            <SelectField value={proc.medicoId} onChange={(v) => setP('medicoId', v)}
              placeholder="Seleccionar médico"
              options={doctores.map((d) => ({ value: d.id, label: d.nombre }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Enfermera asignada</label>
            <SelectField value={proc.enfermeraId} onChange={(v) => setP('enfermeraId', v)}
              placeholder="Sin asignar"
              options={enfermeras.map((e) => ({ value: e.id, label: e.nombre }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Centro *</label>
            <SelectField value={proc.centroId} onChange={(v) => setP('centroId', v)}
              placeholder="Seleccionar centro"
              options={centros.map((c) => ({ value: c.id, label: `${c.nombre} — ${c.ciudad}` }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Producto de preparación *</label>
            <SelectField value={proc.producto} onChange={(v) => setP('producto', v)}
              placeholder="Seleccionar producto"
              options={PRODUCTOS.map((p) => ({ value: p, label: p }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Fecha *</label>
            <Input type="date" value={proc.fecha} onChange={(e) => setP('fecha', e.target.value)}
              min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Hora *</label>
            <Input type="time" value={proc.hora} onChange={(e) => setP('hora', e.target.value)} />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </p>
      )}

      <button type="submit" disabled={saving || !paciente}
        className="flex items-center gap-2 px-6 py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50">
        <CalendarPlus className="w-4 h-4" />
        {saving ? 'Programando...' : 'Confirmar procedimiento'}
      </button>
    </form>
  )
}

// ================================================================
// PANEL PRINCIPAL
// ================================================================
type Tab = 'usuarios' | 'centros' | 'programar'

const TABS = [
  { key: 'usuarios' as Tab, label: 'Usuarios',      icon: Users },
  { key: 'centros'  as Tab, label: 'Centros',        icon: Building2 },
  { key: 'programar' as Tab, label: 'Programar',     icon: CalendarPlus },
]

export function AdminPanel({ centros, usuarios, doctores, enfermeras }: Props) {
  const [tab, setTab] = useState<Tab>('usuarios')

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === key ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'usuarios'  && <TabUsuarios  usuarios={usuarios} centros={centros} />}
      {tab === 'centros'   && <TabCentros   centros={centros} />}
      {tab === 'programar' && <TabProgramar centros={centros} doctores={doctores} enfermeras={enfermeras} />}
    </div>
  )
}
