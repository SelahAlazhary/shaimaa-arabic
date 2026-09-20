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
