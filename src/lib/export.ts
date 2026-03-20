'use client'

/**
 * Descarga un array de objetos como archivo CSV compatible con Excel.
 * Incluye BOM UTF-8 para que Excel abra tildes/ñ correctamente.
 */
export function exportarCSV(
  filas: Record<string, string | number | null | undefined>[],
  nombreArchivo = 'exportacion.csv'
): void {
  if (filas.length === 0) return

  const encabezados = Object.keys(filas[0])
  const escapar = (v: string | number | null | undefined): string => {
    const s = v == null ? '' : String(v)
    // Envolver en comillas si contiene coma, comilla doble o salto de línea
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lineas = [
    encabezados.map(escapar).join(','),
    ...filas.map((fila) => encabezados.map((k) => escapar(fila[k])).join(',')),
  ]

  // BOM para Excel
  const bom = '\uFEFF'
  const blob = new Blob([bom + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
