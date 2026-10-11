import { formatNumber } from '@/lib/utils/format'

type Stage = { id: string; name: string; grades: readonly { id: string; name: string }[] }

/**
 * الصفوف مساراً: لكل مرحلة شارة، وتحتها دوائر ذهبية مرقّمة على خط واحد
 * من أول صفوفها إلى آخرها، ثم اسم كل صف.
 *
 * الأسماء من قاعدة البيانات لا مكتوبة هنا؛ وعدد الصفوف في المرحلة يحدّد
 * عدد الدوائر وموضع الخط، فلا ينكسر الشكل لو أضاف المدير صفًّا.
 */
export function StagesPath({ stages }: { stages: readonly Stage[] }) {
  const visible = stages.filter((s) => s.grades.length > 0)
  if (visible.length === 0) return null

  return (
    <div className="mt-8 rounded-[var(--radius-panel)] bg-brand-800 px-5 py-9 sm:px-8 sm:py-10">
      <div
        className={`grid gap-10 ${
          visible.length > 1
            ? 'lg:grid-cols-2 lg:gap-0 lg:[&>*:not(:first-child)]:border-s lg:[&>*:not(:first-child)]:border-accent/35 lg:[&>*:not(:first-child)]:ps-8 lg:[&>*:not(:last-child)]:pe-8'
            : ''
        }`}
      >
        {visible.map((stage) => {
          const n = stage.grades.length
          const edge = `${100 / (2 * n)}%`

          return (
            <section key={stage.id} aria-label={stage.name}>
              <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-accent px-[1.125rem] py-0.5 text-[0.9375rem] font-semibold text-accent-soft">
                {stage.name}
              </span>

              <ol
                className="relative mt-8 grid"
                style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
              >
                {n > 1 && (
                  <span
                    aria-hidden
                    className="absolute top-[1.6875rem] h-0.5 bg-linear-to-l from-accent to-accent/25"
                    style={{ insetInline: edge }}
                  />
                )}

                {stage.grades.map((g, i) => (
                  <li key={g.id} className="relative px-1 text-center">
                    <span className="nums-ar relative mx-auto mb-3 grid size-[3.375rem] place-items-center rounded-full border-2 border-accent bg-brand-900 font-display text-[1.625rem] font-bold text-accent-soft">
                      {formatNumber(i + 1)}
                    </span>
                    <span className="block text-base font-semibold leading-[1.6] text-ink-invert">
                      {g.name}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}
