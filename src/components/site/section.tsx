import { formatNumber } from '@/lib/utils/format'

/** عنوان قسم: شارة ذهبية صغيرة، ثم العنوان، ثم سطر تمهيدي اختياري. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
}: {
  eyebrow: string
  title: string
  lead?: React.ReactNode
  id: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="flex items-center gap-3 text-[0.9375rem] font-semibold tracking-wide text-accent-ink">
        {eyebrow}
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="h-px w-14 bg-accent/70" />
          <span className="size-1.5 rotate-45 bg-accent" />
          <span className="h-px w-5 bg-accent/70" />
        </span>
      </p>

      <h2 id={id} className="mt-4 font-display text-[2rem] font-bold leading-[1.5] text-brand-800 sm:text-[2.375rem]">
        {title}
      </h2>

      {lead && <p className="mt-4 text-[1.0625rem] leading-[1.95] text-ink-muted">{lead}</p>}
    </div>
  )
}

/**
 * شبكة مرقّمة بخطوط فاصلة رفيعة بدل كروت عائمة.
 * الكرت المستقلّ بظلّ وأيقونة في مربّع يقرأ كقالب جاهز؛ الشبكة المحاطة
 * بإطار واحد وفواصل شعرية تقرأ كجدول مؤسّسي — وهو المطلوب هنا.
 */
export function LedgerGrid({
  items,
  columns = 2,
}: {
  items: readonly { title: string; body: string }[]
  columns?: 2 | 3
}) {
  const cols = columns === 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2'
  const divide = columns === 3 ? 'md:divide-x md:divide-y-0' : 'sm:divide-x sm:divide-y-0'

  return (
    <ul
      className={`mt-10 grid divide-y divide-border-subtle overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface ${cols} ${divide} rtl:divide-x-reverse`}
    >
      {items.map((item, i) => (
        <li key={item.title} className="p-7 sm:p-8">
          <p className="nums-ar text-base font-bold tabular-nums text-accent-ink">
            {formatNumber(i + 1).padStart(2, '٠')}
          </p>
          <h3 className="mt-3 text-lg font-semibold text-brand-800">{item.title}</h3>
          <p className="mt-2.5 text-base leading-[1.9] text-ink-muted">{item.body}</p>
        </li>
      ))}
    </ul>
  )
}
