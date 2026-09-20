'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { renameModule, deleteModule } from '@/lib/mutations/content'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils/format'

export function ModuleList({
  courseId,
  modules,
}: {
  courseId: string
  modules: { id: string; title: string; lessonCount: number }[]
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [pending, start] = useTransition()

  if (modules.length === 0) return null

  const save = (id: string) =>
    start(async () => {
      const res = await renameModule(id, courseId, draft)
      if (res.ok) {
        toast.success(res.message)
        setEditing(null)
      } else {
        toast.error(res.message)
      }
    })

  return (
    <ul className="divide-y divide-border-subtle border-t border-border-subtle">
      {modules.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
          {editing === m.id ? (
            <>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save(m.id)
                  if (e.key === 'Escape') setEditing(null)
                }}
                aria-label={`اسم الوحدة ${m.title}`}
                autoFocus
                className="h-10 min-w-0 flex-1 rounded-[var(--radius-field)] border border-border-strong bg-surface px-3 text-base text-ink"
              />
              <span className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  loading={pending}
                  onClick={() => save(m.id)}
                  aria-label="حفظ الاسم"
                >
                  <Check aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(null)}
                  disabled={pending}
                  aria-label="إلغاء"
                >
                  <X aria-hidden />
                </Button>
              </span>
            </>
          ) : (
            <>
              <span className="min-w-0">
                <span className="block truncate text-base text-ink">{m.title}</span>
                <span className="nums-ar text-sm text-ink-faint">
                  {formatNumber(m.lessonCount)} درس
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft(m.title)
                    setEditing(m.id)
                  }}
                  aria-label={`تعديل اسم ${m.title}`}
                >
                  <Pencil aria-hidden />
                </Button>

                <ConfirmButton
                  label=""
                  srLabel={`حذف الوحدة ${m.title}`}
                  icon={<Trash2 aria-hidden />}
                  title="حذف الوحدة؟"
                  body={
                    m.lessonCount > 0
                      ? `ستُحذف «${m.title}» فقط، ودروسها (${formatNumber(m.lessonCount)}) تبقى كما هي لكن بلا وحدة.`
                      : `ستُحذف الوحدة «${m.title}». لا دروس فيها.`
                  }
                  confirmLabel="احذف الوحدة"
                  action={() => deleteModule(m.id, courseId)}
                />
              </span>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
