'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Save, SlidersHorizontal } from 'lucide-react'
import { setAdminPages } from '@/lib/mutations/staff'
import { ADMIN_PAGES, labelOfPage } from '@/lib/permissions/pages'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/card'

const ALL = ADMIN_PAGES.map((p) => p.key) as string[]

/**
 * صفحات مدير قائم.
 * `null` تعني «كل الصفحات» — وهي مختلفة عن اختيار الصفحات كلها يدويًّا:
 * الأولى ترث ما يُضاف لاحقًا، والثانية لا.
 */
export function AdminPagesEditor({
  userId,
  fullName,
  current,
}: {
  userId: string
  fullName: string
  current: string[] | null
}) {
  const [open, setOpen] = useState(false)
  const [pages, setPages] = useState<string[]>(current ?? ALL)
  const [pending, start] = useTransition()

  const save = () =>
    start(async () => {
      const res = await setAdminPages(userId, pages)
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
      } else {
        toast.error(res.message)
      }
    })

  if (!open) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        {current === null ? (
          <Badge tone="info">كل الصفحات</Badge>
        ) : current.length === 0 ? (
          <Badge tone="warning">لا صفحات</Badge>
        ) : (
          current.map((key) => <Badge key={key}>{labelOfPage(key)}</Badge>)
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPages(current ?? ALL)
            setOpen(true)
          }}
          aria-label={`تعديل صفحات ${fullName}`}
        >
          <SlidersHorizontal aria-hidden />
          الصفحات
        </Button>
      </span>
    )
  }

  return (
    <div className="w-full space-y-3 rounded-[var(--radius-field)] border border-border-subtle bg-surface-muted p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-medium text-ink">صفحات {fullName}</p>
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setPages(ALL)}>
            الكل
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPages([])}>
            لا شيء
          </Button>
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {ADMIN_PAGES.map((page) => (
          <label
            key={page.key}
            className="flex items-start gap-2.5 rounded-[var(--radius-field)] border border-border-subtle bg-surface p-3"
          >
            <input
              type="checkbox"
              checked={pages.includes(page.key)}
              onChange={(e) =>
                setPages((prev) =>
                  e.target.checked ? [...prev, page.key] : prev.filter((k) => k !== page.key),
                )
              }
              className="mt-0.5 size-4 rounded border-border-strong"
            />
            <span className="min-w-0">
              <span className="block text-base text-ink">{page.label}</span>
              <span className="block text-sm text-ink-faint">{page.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-ink-faint">
        الصفحة غير المختارة تختفي من قائمته، ولا يفتحها برابط مباشر، ولا تقبل
        منه قاعدة البيانات تعديلًا فيها. «نظرة عامة» مفتوحة دائمًا.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button loading={pending} loadingText="جارٍ الحفظ…" onClick={save}>
          <Save aria-hidden />
          حفظ الصفحات
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          إلغاء
        </Button>
      </div>
    </div>
  )
}
