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
 * اللونان من الهوية نفسها: الأخضر الفاتح والذهبي الفاتح يتبادلان،
 * وحلقة داخلية من درجة كلٍّ منهما تحدّ اللوحة بلا إطار ثقيل ولا ظلّ.
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

        // لونان من الهوية يتبادلان: الأخضر الفاتح والذهبي الفاتح
        const green = 'bg-brand-50/80 ring-1 ring-inset ring-brand-100'
        const gold = 'bg-accent-bg/70 ring-1 ring-inset ring-accent/20'

        const base = zebra ? green : gold
        // القاعدة تُنقَض عند نقطة الأعمدة وحدها، وفقط إن اختلف النمطان
        const atCols =
          checker === zebra
            ? ''
            : columns === 3
              ? checker
                ? 'md:bg-brand-50/80 md:ring-brand-100'
                : 'md:bg-accent-bg/70 md:ring-accent/20'
              : checker
                ? 'sm:bg-brand-50/80 sm:ring-brand-100'
                : 'sm:bg-accent-bg/70 sm:ring-accent/20'

        return (
          <li key={item.title} className="border-t border-border-strong py-4">
            <div
              className={`grid grid-cols-[2.5rem_1fr] gap-x-3 rounded-[var(--radius-card)] p-6 ${base} ${atCols}`}
            >
              <span className="nums-ar font-display text-[1.375rem] font-bold leading-none tabular-nums text-accent-ink">
                {`–${formatNumber(i + 1)}`}
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
