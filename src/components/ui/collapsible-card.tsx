import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * بطاقة يُطوى محتواها.
 *
 * الصفحة الطويلة تُخفي أقسامها بطولها: عنوان المقرر وصورته يُضبطان مرّة،
 * ثم يبقيان يزاحمان الدروس في كل زيارة. الطيّ يجعل المفتوح هو المقصود.
 *
 * <details> الأصلي لا JavaScript فيه: يبقى مكوّن خادم، فتمرّ إليه أيقونات
 * Lucide (وهي دوال لا تعبر حدّ العميل)، ويعمل الطيّ قبل الترطيب وبعده،
 * ويُعلَن للقارئ الصوتي بلا aria إضافي.
 */
export function CollapsibleCard({
  title,
  icon: Icon,
  defaultOpen = false,
  summary,
  children,
}: {
  title: string
  icon?: LucideIcon
  defaultOpen?: boolean
  /** سطر يصف ما بالداخل، يظهر حين تكون مطويّة */
  summary?: string
  children: React.ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        'group rounded-[var(--radius-card)] border border-border-subtle bg-surface',
        'shadow-[var(--shadow-card)]',
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-2 px-5 py-4',
          'rounded-[var(--radius-card)] transition-colors hover:bg-surface-muted',
          'group-open:rounded-b-none [&::-webkit-details-marker]:hidden',
        )}
      >
        {Icon && <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />}

        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-ink">{title}</span>
          {summary && (
            <span className="nums-ar mt-0.5 block truncate text-sm text-ink-faint group-open:hidden">
              {summary}
            </span>
          )}
        </span>

        <ChevronDown
          className="size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="border-t border-border-subtle">{children}</div>
    </details>
  )
}
