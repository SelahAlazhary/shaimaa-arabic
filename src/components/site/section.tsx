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
 * جدول مسطور: بنود مرقّمة يفصلها خطّ علوي رفيع، بلا صندوق ولا خلفية.
 *
 * الكرت المستقلّ — بإطاره وخلفيته — يقرأ كقالب جاهز مهما نُظّف. والسطر
 * الأفقي وحده هو ما تفعله المطبوعات الرسمية: فهرس كتاب، أو بنود لائحة.
 * الرقم في عمود ثابت العرض، فيتحاذى العنوان والشرح معه تحاذيًا تامًّا
 * عبر البنود كلها — وهذا التحاذي هو ما يُقرأ «رسميًّا» لا الزخرفة.
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
      {items.map((item, i) => (
        <li
          key={item.title}
          className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-border-strong py-7"
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
        </li>
      ))}
    </ul>
  )
}
