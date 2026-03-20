'use client'

export interface PDFConfig {
  titulo: string
  subtitulo?: string
  columnas: string[]
  filas: (string | number)[][]
  nombreArchivo?: string
}

/**
 * Genera y descarga un PDF con tabla, título y subtítulo.
 * Usa jsPDF + jspdf-autotable para el formato.
 */
export async function exportarPDF({ titulo, subtitulo, columnas, filas, nombreArchivo = 'reporte.pdf' }: PDFConfig): Promise<void> {
  // Dynamic imports — avoid SSR issues
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 45, 82) // navy
  doc.text(titulo, 40, 40)

  if (subtitulo) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // gray-500
    doc.text(subtitulo, 40, 56)
  }

  // Branding
  doc.setFontSize(8)
  doc.setTextColor(12, 165, 160) // teal
  doc.text('Enfoque 360 · Tecnoquímicas', 40, subtitulo ? 70 : 56)

  // Table
  autoTable(doc, {
    head: [columnas],
    body: filas,
    startY: subtitulo ? 84 : 70,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [15, 45, 82], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  })

  // Page numbers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pages = (doc as any).internal.getNumberOfPages() as number
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Página ${i} de ${pages}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 16, { align: 'right' })
  }

  doc.save(nombreArchivo)
}

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
