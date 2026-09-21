'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronDown, Save, ExternalLink } from 'lucide-react'
import { saveStaticPage } from '@/lib/mutations/settings'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils/format'

export type StaticPageRow = {
  slug: string
  title: string
  content: string
  isPublished: boolean
  updatedAt: string
}

export function StaticPagesManager({ pages }: { pages: StaticPageRow[] }) {
  const [open, setOpen] = useState<string | null>(pages[0]?.slug ?? null)

  return (
    <div className="divide-y divide-border-subtle">
      {pages.map((page) => (
        <PageEditor
          key={page.slug}
          page={page}
          isOpen={open === page.slug}
          onToggle={() => setOpen((s) => (s === page.slug ? null : page.slug))}
        />
      ))}
    </div>
  )
}

function PageEditor({
  page,
  isOpen,
  onToggle,
}: {
  page: StaticPageRow
  isOpen: boolean
  onToggle: () => void
}) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content)
  const [isPublished, setIsPublished] = useState(page.isPublished)
  const [pending, start] = useTransition()

  const dirty =
    title !== page.title || content !== page.content || isPublished !== page.isPublished

  const save = () =>
    start(async () => {
      const res = await saveStaticPage({ slug: page.slug, title, content, isPublished })
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2.5 text-base font-semibold text-ink">
              {page.title}
              <Badge tone={page.isPublished ? 'success' : 'neutral'}>
                {page.isPublished ? 'منشورة' : 'مسودّة'}
              </Badge>
            </span>
            <span className="nums-ar mt-0.5 block text-sm text-ink-faint">
              /p/{page.slug} · آخر تحديث {formatDateTime(page.updatedAt)}
            </span>
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {page.isPublished && (
          <Link
            href={`/p/${page.slug}`}
            target="_blank"
            className="tap-target grid shrink-0 place-items-center rounded-[var(--radius-field)] text-ink-faint hover:bg-surface-muted hover:text-ink"
            aria-label={`معاينة ${page.title}`}
          >
            <ExternalLink className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      {isOpen && (
        <div className="space-y-4 bg-surface-muted px-5 pb-5 pt-1">
          <Field label="عنوان الصفحة" required>
            {({ id }) => (
              <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} required />
            )}
          </Field>

          <Field
            label="محتوى الصفحة"
            hint="نصّ عادي. السطر الفارغ يفصل بين الفقرات، والسطر المنتهي بنقطتين يظهر عنوانًا فرعيًّا."
          >
            {({ id }) => (
              <textarea
                id={id}
                rows={12}
                maxLength={20000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-[1.9] text-ink"
              />
            )}
          </Field>

          <label className="flex items-start gap-2.5 rounded-[var(--radius-field)] border border-border-subtle bg-surface p-4">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border-strong"
            />
            <span>
              <span className="block text-base font-medium text-ink">منشورة</span>
              <span className="block text-sm text-ink-muted">
                تظهر للزوّار ويُضاف رابطها إلى تذييل الموقع
              </span>
            </span>
          </label>

          <Button loading={pending} loadingText="جارٍ الحفظ…" disabled={!dirty} onClick={save}>
            <Save aria-hidden />
            حفظ الصفحة
          </Button>
        </div>
      )}
    </section>
  )
}
