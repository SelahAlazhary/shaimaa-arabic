import { formatNumber } from '@/lib/utils/format'

/** عنوان قسم: العنوان، ثم سطر تمهيدي اختياري. */
export function SectionHeading({
  title,
  lead,
  id,
  invert = false,
}: {
  title: string
  lead?: React.ReactNode
  id: string
  /** للأقسام ذات الخلفية الداكنة. */
  invert?: boolean
}) {
  return (
    <div className="max-w-2xl">
      <h2
        id={id}
        className={`font-display text-[2rem] font-bold leading-[1.5] sm:text-[2.375rem] ${invert ? 'text-ink-invert' : 'text-brand-800'}`}
      >
        {title}
      </h2>

      {lead && (
        <p
          className={`mt-4 text-[1.0625rem] leading-[1.95] ${invert ? 'text-brand-200' : 'text-ink-muted'}`}
        >
          {lead}
        </p>
      )}
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
                <span aria-hidden>–</span>
                <span>{formatNumber(i + 1)}</span>
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

/**
 * بنود مرقّمة على أرضية داكنة: رقم ذهبي كبير، فعنوان، فشرح، بخطوط فاصلة رفيعة.
 * للأقسام الداكنة وحدها — الفاتحة تبقى على LedgerGrid.
 */
export function FeatureRows({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <ol className="mt-9 border-t border-white/10">
      {items.map((item, i) => (
        <li
          key={item.title}
          className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-1 border-b border-white/10 py-6 md:grid-cols-[5.5rem_17.5rem_1fr]"
        >
          <span className="nums-ar font-display text-[2.75rem] font-bold leading-none text-accent">
            {formatNumber(i + 1)}
          </span>
          <h3 className="font-display text-[1.625rem] font-bold leading-[1.5] text-ink-invert">
            {item.title}
          </h3>
          <p className="col-span-2 text-base leading-[1.95] text-brand-200 md:col-span-1">{item.body}</p>
        </li>
      ))}
    </ol>
  )
}

/**
 * الخطوات على لوحة خضراء بثلاثة أعمدة، ورقم ذهبي ضخم باهت خلف كل خطوة.
 * الرقم زخرفة (`aria-hidden`) والقائمة مرقّمة أصلًا للقارئ الآلي.
 */
export function StepsPanel({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <ol className="mt-12 grid overflow-hidden rounded-[var(--radius-panel)] border border-accent/40 bg-brand-800 md:grid-cols-3">
      {items.map((item, i) => (
        <li
          key={item.title}
          className="relative overflow-hidden border-accent/30 px-7 pb-10 pt-9 [&:not(:first-child)]:border-t md:[&:not(:first-child)]:border-s md:[&:not(:first-child)]:border-t-0"
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-linear-to-l from-accent to-transparent" />
          <span
            aria-hidden
            className="nums-ar pointer-events-none absolute end-5 top-1.5 select-none font-display text-[7.5rem] font-bold leading-none text-accent/15"
          >
            {formatNumber(i + 1)}
          </span>
          <h3 className="relative mt-[4.25rem] font-display text-[1.6875rem] font-bold leading-[1.5] text-ink-invert">
            {item.title}
          </h3>
          <p className="relative mt-2 text-base leading-[1.95] text-brand-100">{item.body}</p>
        </li>
      ))}
    </ol>
  )
}
