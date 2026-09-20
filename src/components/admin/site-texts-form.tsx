'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Save, RotateCcw, ChevronDown, ExternalLink } from 'lucide-react'
import { saveSiteTexts, type TextsState } from '@/lib/mutations/site-texts'
import { TEXT_GROUPS } from '@/lib/site/texts'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils/format'

const initial: TextsState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الحفظ…">
      <Save aria-hidden />
      احفظ النصوص
    </Button>
  )
}

export function SiteTextsForm({ current }: { current: Record<string, string> }) {
  const [state, formAction] = useActionState(saveSiteTexts, initial)

  // القيمة المعروضة: ما حُفظ إن وُجد، وإلّا الأصل
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    for (const g of TEXT_GROUPS) {
      for (const i of g.items) out[i.key] = current[i.key] ?? i.value
    }
    return out
  })

  const [open, setOpen] = useState<string>(TEXT_GROUPS[0]?.id ?? '')

  useEffect(() => {
    if (state.status === 'success') toast.success(state.message)
    if (state.status === 'error') toast.error(state.message)
  }, [state])

  const set = (key: string, value: string) => setValues((p) => ({ ...p, [key]: value }))

  const changedCount = TEXT_GROUPS.flatMap((g) => g.items).filter(
    (i) => values[i.key]?.trim() && values[i.key]?.trim() !== i.value,
  ).length

  return (
    <form action={formAction} className="p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-base leading-[1.9] text-ink-muted">
          عدّل أي نصّ في الصفحة الرئيسية. أفرغ الحقل لإرجاعه إلى صيغته الأصلية.
          التغيير يظهر للزوّار فور الحفظ.
        </p>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-base text-brand-600 underline-offset-4 hover:underline"
        >
          عاين الصفحة
          <ExternalLink className="size-4" aria-hidden />
        </a>
      </div>

      <div className="space-y-2">
        {TEXT_GROUPS.map((group) => {
          const isOpen = open === group.id
          const groupChanged = group.items.filter(
            (i) => values[i.key]?.trim() && values[i.key]?.trim() !== i.value,
          ).length

          return (
            <section key={group.id} className="rounded-[var(--radius-card)] border border-border-subtle">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? '' : group.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start"
                >
                  <span className="text-base font-semibold text-ink">
                    {group.title}
                    {groupChanged > 0 && (
                      <span className="nums-ar ms-2 text-sm font-normal text-accent-ink">
                        ({formatNumber(groupChanged)} معدَّل)
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
              </h3>

              {isOpen && (
                <div className="space-y-4 border-t border-border-subtle p-5">
                  {group.items.map((item) => {
                    const id = `txt-${item.key}`
                    const edited = (values[item.key] ?? '').trim() !== item.value

                    return (
                      <div key={item.key}>
                        <label
                          htmlFor={id}
                          className="mb-1.5 flex flex-wrap items-center gap-2 text-base font-medium text-ink"
                        >
                          {item.label}
                          {edited && (
                            <button
                              type="button"
                              onClick={() => set(item.key, item.value)}
                              className="inline-flex items-center gap-1 text-sm font-normal text-ink-muted underline-offset-4 hover:text-brand-600 hover:underline"
                            >
                              <RotateCcw className="size-3.5" aria-hidden />
                              أرجع الأصل
                            </button>
                          )}
                        </label>

                        {item.long ? (
                          <textarea
                            id={id}
                            name={item.key}
                            rows={2}
                            maxLength={600}
                            value={values[item.key] ?? ''}
                            onChange={(e) => set(item.key, e.target.value)}
                            className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink"
                          />
                        ) : (
                          <input
                            id={id}
                            name={item.key}
                            maxLength={600}
                            value={values[item.key] ?? ''}
                            onChange={(e) => set(item.key, e.target.value)}
                            className="h-12 w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 text-base text-ink"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* الحقول المطويّة لا تُرسَل، فنرسل قيمتها مخفيّة حتى لا تُمحى */}
      {TEXT_GROUPS.filter((g) => g.id !== open).flatMap((g) =>
        g.items.map((i) => (
          <input key={i.key} type="hidden" name={i.key} value={values[i.key] ?? ''} />
        )),
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SubmitButton />
        <p className="nums-ar text-base text-ink-muted">
          {changedCount > 0
            ? `${formatNumber(changedCount)} نصًّا مخصَّصًا`
            : 'كل النصوص على أصلها'}
        </p>
      </div>
    </form>
  )
}
