/**
 * تصدير CSV (البند 36).
 *
 * BOM في أول الملف ضروري: بدونه يفتح Excel على ويندوز الملف بترميز
 * النظام المحلي فتظهر العربية حروفًا مشوّشة.
 */
const BOM = '﻿'

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  // التعادل مع حقن الصيغ في Excel: خلية تبدأ بـ= أو + أو - أو @ قد تُنفَّذ
  const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))]
  return BOM + lines.join('\r\n')
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'no-store',
    },
  })
}
