'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { toggleLessonPublished } from '@/lib/mutations/content'
import { Button } from '@/components/ui/button'

/**
 * إخفاء الدرس لا حذفه.
 * الحذف يُسقط سجلات تقدّم الطلاب معه (ON DELETE CASCADE) فيضيع تاريخهم — البند 10.
 */
export function LessonVisibilityToggle({
  lessonId,
  courseId,
  published,
}: {
  lessonId: string
  courseId: string
  published: boolean
}) {
  const [pending, start] = useTransition()

  const toggle = () =>
    start(async () => {
      const res = await toggleLessonPublished(lessonId, courseId, !published)
      if (res.ok) toast.success(published ? 'تم إخفاء الدرس.' : 'تم نشر الدرس.')
      else toast.error('تعذّر التغيير. أعد المحاولة.')
    })

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={toggle}
      aria-label={published ? 'إخفاء الدرس' : 'نشر الدرس'}
      className="shrink-0"
    >
      {!pending && (published ? <EyeOff aria-hidden /> : <Eye aria-hidden />)}
      {published ? 'إخفاء' : 'نشر'}
    </Button>
  )
}
