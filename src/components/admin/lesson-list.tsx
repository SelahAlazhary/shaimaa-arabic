'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BookOpen, Clock, Eye, EyeOff, ChevronUp, ChevronDown, Pencil } from 'lucide-react'
import { moveLesson } from '@/lib/mutations/content'
import { LessonForm, type LessonDefaults } from '@/components/admin/lesson-form'
import { LessonVisibilityToggle } from '@/components/admin/lesson-visibility-toggle'
import { EmptyState, Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNumber, formatDuration } from '@/lib/utils/format'

export type LessonRow = LessonDefaults & {
  durationSeconds: number
  moduleTitle: string | null
  hasVideo: boolean
}

export function LessonList({
  courseId,
  modules,
  lessons,
}: {
  courseId: string
  modules: { id: string; title: string }[]
  lessons: LessonRow[]
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [moving, startMove] = useTransition()

  const move = (id: string, direction: 'up' | 'down') =>
    startMove(async () => {
      const res = await moveLesson(id, courseId, direction)
      if (!res.ok) toast.error(res.message)
    })

  if (lessons.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="لا دروس بعد"
        description="أضف أول درس من النموذج بالأعلى، وسيظهر هنا فورًا."
      />
    )
  }

  return (
    <ol className="divide-y divide-border-subtle">
      {lessons.map((l, i) => {
        if (editing === l.id) {
          return (
            <li key={l.id} className="bg-surface-muted">
              <LessonForm
                courseId={courseId}
                modules={modules}
                lesson={l}
                onDone={() => setEditing(null)}
              />
            </li>
          )
        }

        // الترتيب داخل الوحدة، فالسهم يُعطَّل عند طرف مجموعته لا القائمة كلها
        const sameGroup = lessons.filter((x) => x.moduleId === l.moduleId)
        const posInGroup = sameGroup.findIndex((x) => x.id === l.id)

        return (
          <li key={l.id} className="px-5 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="nums-ar text-sm text-ink-faint">{formatNumber(i + 1)}.</span>
                  <span className="text-base font-medium text-ink">{l.title}</span>
                  {l.isFree && <Badge tone="info">مجاني</Badge>}
                  {!l.hasVideo && <Badge tone="warning">بلا فيديو</Badge>}
                </span>
                <span className="nums-ar mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint">
                  {l.durationSeconds > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      {formatDuration(l.durationSeconds)}
                    </span>
                  )}
                  {l.moduleTitle && <span>{l.moduleTitle}</span>}
                  <span className="flex items-center gap-1">
                    {l.isPublished ? (
                      <>
                        <Eye className="size-3" aria-hidden />
                        ظاهر
                      </>
                    ) : (
                      <>
                        <EyeOff className="size-3" aria-hidden />
                        مخفي
                      </>
                    )}
                  </span>
                </span>
              </span>

              <LessonVisibilityToggle
                lessonId={l.id}
                courseId={courseId}
                published={l.isPublished}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1">
              {/* أزرار لا سحب: تعمل بلوحة المفاتيح وباللمس معًا (البند 22) */}
              <Button
                variant="ghost"
                size="sm"
                disabled={posInGroup === 0 || moving}
                onClick={() => move(l.id, 'up')}
                aria-label={`تقديم درس ${l.title}`}
              >
                <ChevronUp aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={posInGroup === sameGroup.length - 1 || moving}
                onClick={() => move(l.id, 'down')}
                aria-label={`تأخير درس ${l.title}`}
              >
                <ChevronDown aria-hidden />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(l.id)}>
                <Pencil aria-hidden />
                تعديل
              </Button>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
