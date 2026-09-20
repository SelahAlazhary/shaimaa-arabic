import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-border-subtle bg-surface shadow-[var(--shadow-card)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string
  icon?: LucideIcon
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
        {Icon && <Icon className="size-4 text-ink-muted" aria-hidden />}
        {title}
      </h3>
      {action}
    </div>
  )
}

/**
 * حالة الفراغ: رسالة واضحة + خطوة تالية (البند 16).
 * الشاشة الفارغة بلا تفسير تجعل الطالب يظن أن المنصة معطّلة.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-surface-muted text-ink-faint">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mt-1.5 max-w-xs text-base leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'neutral' | 'success' | 'info' | 'warning'
}) {
  const tones = {
    neutral: 'bg-surface-muted text-ink-muted',
    success: 'bg-success-bg text-success',
    info: 'bg-info-bg text-info',
    warning: 'bg-warning-bg text-warning',
  } as const

  return (
    <Card className="p-5">
      <span className={cn('mb-4 grid size-9 place-items-center rounded-[var(--radius-field)]', tones[tone])}>
        <Icon className="size-[1.125rem]" aria-hidden />
      </span>
      <p className="nums-ar text-2xl font-semibold leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-base text-ink-muted">{label}</p>
    </Card>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const tones = {
    neutral: 'bg-surface-muted text-ink-muted',
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    danger: 'bg-danger-bg text-danger',
    info: 'bg-info-bg text-info',
  } as const

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-sm font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-border-subtle"
    >
      <div
        className="h-full rounded-[var(--radius-pill)] bg-brand-600 transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
