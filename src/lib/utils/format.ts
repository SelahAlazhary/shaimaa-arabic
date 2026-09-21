/** تنسيقات العرض بالعربية المصرية. الأرقام شرقية في العرض فقط، لا في الإدخال. */

const AR = 'ar-EG'

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(AR, { dateStyle: 'medium' }).format(d)
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(AR, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(AR).format(value)
}

/**
 * سنة بأرقام عربية بلا فاصل آلاف.
 * `formatNumber(2026)` يعطي «٢٬٠٢٦» — صحيح كعدد، خطأ كسنة.
 */
export function formatYear(value: number): string {
  return new Intl.NumberFormat(AR, { useGrouping: false }).format(value)
}

/**
 * تمييز العدد في العربية أربع صور لا صورة واحدة:
 * «كود واحد» · «كودان» · «٥ أكواد» · «١٥ كودًا».
 * كتابة «5 كود» تُفسد النصّ مهما صحّ العدد.
 */
export function pluralAr(
  count: number,
  forms: { one: string; two: string; few: string; many: string },
): string {
  if (count === 1) return forms.one
  if (count === 2) return forms.two

  const rest = count % 100
  const word = rest >= 3 && rest <= 10 ? forms.few : forms.many
  return `${formatNumber(count)} ${word}`
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat(AR, { style: 'percent', maximumFractionDigits: 0 })
    .format(value / 100)
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat(AR, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })
    .format(value)
}

/** مدة الدرس: "٤٥ دقيقة" أو "١ س ٢٠ د" */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${formatNumber(mins)} دقيقة`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${formatNumber(h)} ساعة` : `${formatNumber(h)} س ${formatNumber(m)} د`
}

export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${formatNumber(Math.max(1, Math.round(bytes / 1024)))} ك.ب`
  return `${formatNumber(Number(mb.toFixed(1)))} م.ب`
}
