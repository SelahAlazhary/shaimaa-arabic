import { formatNumber } from '@/lib/utils/format'

/** عنوان قسم: العنوان، ثم سطر تمهيدي اختياري. */
export function SectionHeading({
  title,
  lead,
  id,
}: {
  title: string
  lead?: React.ReactNode
  id: string
}) {
  return (
    <div className="max-w-2xl">
      <h2 id={id} className="font-display text-[2rem] font-bold leading-[1.5] text-brand-800 sm:text-[2.375rem]">
        {title}
      </h2>

      {lead && <p className="mt-4 text-[1.0625rem] leading-[1.95] text-ink-muted">{lead}</p>}
    </div>
  )
}

/**
 * جدول مسطور ببنود متبادلة التظليل.
 *
 * التظليل شطرنجي على الشبكة: يُحسب من موضع البند (صفّه وعموده) لا من
 * ترتيبه، فتتقاطر اللوحات المظلَّلة كرقعة. وفي العمود الواحد على الموبايل
 * يصير التبادل صفّيًّا — الشطرنجة بلا أعمدة تُقرأ فوضى لا نمطًا.
 *
 * الخلفية من الأخضر الفاتح في الهوية لا رماديًّا محايدًا، وحلقة أفتح
 * تحدّ اللوحة بلا إطار ثقيل ولا ظلّ.
 */
export function LedgerGrid({
  items,
  columns = 2,
}: {
  items: readonly { title: string; body: string }[]
  columns?: 2 | 3
}) {
  const cols = columns === 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2'

  return (
    <ul className={`mt-12 grid gap-x-14 ${cols}`}>
      {items.map((item, i) => {
        // عمود واحد: تبادل صفّي. أعمدة: رقعة شطرنج
        const zebra = i % 2 === 0
        const checker = (Math.floor(i / columns) + (i % columns)) % 2 === 0

        const tinted = 'bg-brand-50/80 ring-1 ring-inset ring-brand-100'
        const plain = 'bg-transparent ring-0'

        const base = zebra ? tinted : plain
        // القاعدة تُنقَض عند نقطة الأعمدة وحدها، وفقط إن اختلف النمطان
        const atCols =
          checker === zebra
            ? ''
            : columns === 3
              ? checker
                ? 'md:bg-brand-50/80 md:ring-1 md:ring-inset md:ring-brand-100'
                : 'md:bg-transparent md:ring-0'
              : checker
                ? 'sm:bg-brand-50/80 sm:ring-1 sm:ring-inset sm:ring-brand-100'
                : 'sm:bg-transparent sm:ring-0'

        return (
          <li key={item.title} className="border-t border-border-strong py-4">
            <div
              className={`grid grid-cols-[2.5rem_1fr] gap-x-3 rounded-[var(--radius-card)] p-6 ${base} ${atCols}`}
            >
              <span className="nums-ar font-display text-[1.375rem] font-bold leading-none tabular-nums text-accent-ink">
                {formatNumber(i + 1).padStart(2, '٠')}
              </span>

              <div>
                <h3 className="font-display text-[1.375rem] font-bold leading-none text-brand-800">
                  {item.title}
                </h3>
                <p className="mt-3.5 text-base leading-[1.95] text-ink-muted">{item.body}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
