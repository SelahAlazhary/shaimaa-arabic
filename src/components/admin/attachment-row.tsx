'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Download, Trash2, Unlink } from 'lucide-react'
import {
  deleteAttachment,
  unlinkAttachment,
  linkAttachment,
  linkAttachmentToLesson,
  unlinkAttachmentFromLesson,
} from '@/lib/mutations/attachments'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { Badge } from '@/components/ui/card'

export function AttachmentRow({
  file,
  courses,
  allCourses,
  lessons,
  allLessons,
}: {
  file: { id: string; title: string; meta: string }
  courses: { courseId: string; title: string }[]
  allCourses: { id: string; title: string }[]
  lessons: { lessonId: string; title: string; courseTitle: string }[]
  allLessons: { id: string; title: string; courseTitle: string }[]
}) {
  const [unlinking, startUnlink] = useTransition()
  const linked = new Set(courses.map((c) => c.courseId))
  const available = allCourses.filter((c) => !linked.has(c.id))

  const linkedLessons = new Set(lessons.map((l) => l.lessonId))
  const availableLessons = allLessons.filter((l) => !linkedLessons.has(l.id))

  const linkLesson = (lessonId: string) =>
    startUnlink(async () => {
      const res = await linkAttachmentToLesson(file.id, lessonId)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  const unlinkLesson = (lessonId: string) =>
    startUnlink(async () => {
      const res = await unlinkAttachmentFromLesson(file.id, lessonId)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  const link = (courseId: string) =>
    startUnlink(async () => {
      const res = await linkAttachment(file.id, courseId)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  const unlink = (courseId: string) =>
    startUnlink(async () => {
      const res = await unlinkAttachment(file.id, courseId)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-base font-medium text-ink">{file.title}</span>
          <span className="nums-ar mt-0.5 block text-sm text-ink-faint">{file.meta}</span>
        </span>

        <a
          href={`/attachments/${file.id}`}
          className="tap-target grid shrink-0 place-items-center rounded-[var(--radius-field)] text-ink-faint hover:bg-surface-muted hover:text-ink"
          aria-label={`تحميل ${file.title}`}
        >
          <Download className="size-4" aria-hidden />
        </a>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {courses.length === 0 && lessons.length === 0 ? (
          <Badge tone="warning">غير مرتبط — لا يراه أحد</Badge>
        ) : (
          courses.map((c) => (
            <span
              key={c.courseId}
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-surface-muted py-1 pe-2.5 ps-1 text-sm text-ink-muted"
            >
              {c.title}
              {/* فكّ الربط يخفي الملف عن طلاب المقرر ولا يحذفه، فلا يحتاج تأكيدًا */}
              <button
                type="button"
                onClick={() => unlink(c.courseId)}
                disabled={unlinking}
                aria-label={`فكّ ربط ${file.title} عن ${c.title}`}
                className="grid size-5 place-items-center rounded-full text-ink-faint transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-50"
              >
                <Unlink className="size-3" aria-hidden />
              </button>
            </span>
          ))
        )}

        {lessons.map((l) => (
          <span
            key={l.lessonId}
            className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-brand-50 py-1 pe-2.5 ps-1 text-sm text-brand-700"
          >
            {l.courseTitle} · {l.title}
            <button
              type="button"
              onClick={() => unlinkLesson(l.lessonId)}
              disabled={unlinking}
              aria-label={`فكّ ربط ${file.title} عن درس ${l.title}`}
              className="grid size-5 place-items-center rounded-full text-ink-faint transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-50"
            >
              <Unlink className="size-3" aria-hidden />
            </button>
          </span>
        ))}

        {availableLessons.length > 0 && (
          <label className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <span className="sr-only">اربط {file.title} بدرس</span>
            <select
              value=""
              onChange={(e) => e.target.value && linkLesson(e.target.value)}
              disabled={unlinking}
              className="h-8 rounded-[var(--radius-field)] border border-border-strong bg-surface px-2 text-sm text-ink"
            >
              <option value="">اربط بدرس…</option>
              {availableLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.courseTitle} · {l.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {available.length > 0 && (
          <label className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <span className="sr-only">اربط {file.title} بمقرر</span>
            <select
              value=""
              onChange={(e) => e.target.value && link(e.target.value)}
              disabled={unlinking}
              className="h-8 rounded-[var(--radius-field)] border border-border-strong bg-surface px-2 text-sm text-ink"
            >
              <option value="">اربط بمقرر…</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <ConfirmButton
          label="حذف الملف"
          icon={<Trash2 aria-hidden />}
          title="حذف الملف نهائيًا؟"
          body={`سيُحذف «${file.title}» من التخزين ويختفي عن كل المقررات المرتبطة به. لا يمكن التراجع.`}
          confirmLabel="احذف الملف"
          action={() => deleteAttachment(file.id)}
        />
      </div>
    </li>
  )
}
