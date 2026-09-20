import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ChevronRight, ChevronLeft, Clock } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { getLesson } from '@/lib/queries/course'
import { Card } from '@/components/ui/card'
import { LessonPlayer } from '@/components/student/lesson-player'
import { formatDuration } from '@/lib/utils/format'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>
}): Promise<Metadata> {
  const { slug, lessonId } = await params
  const lesson = await getLesson(slug, lessonId)
  return { title: lesson?.title ?? 'الدرس' }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const student = await requireStudent()
  const { slug, lessonId } = await params

  /*
   * العلامة المائية: الاسم مع آخر أربعة أرقام من مُعرّف الحساب.
   * الاسم وحده قد يتكرّر بين طالبين، والمُعرّف كاملًا تسريبٌ لا داعي له —
   * أربعة أحرف تكفي لتمييز المصدر عند الرجوع إلى قاعدة البيانات.
   */
  const watermarkLabel = `${student.fullName} · ${student.id.slice(-4)}`
  const lesson = await getLesson(slug, lessonId)

  if (!lesson) notFound()

  // غياب الرابط مع وجود الدرس يعني أن RLS حجبته: الطالب غير مستحق.
  // التمييز مهم: «غير مشترك» رسالة مختلفة عن «لا يوجد فيديو».
  const entitled = lesson.videoUrl !== null

  return (
    <div className="space-y-5">
      <Link
        href={`/student/courses/${slug}`}
        className="inline-flex items-center gap-1.5 text-base text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        {lesson.courseTitle}
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-ink sm:text-xl">{lesson.title}</h1>
        {lesson.durationSeconds > 0 && (
          <p className="nums-ar mt-1 flex items-center gap-1.5 text-base text-ink-faint">
            <Clock className="size-3.5" aria-hidden />
            {formatDuration(lesson.durationSeconds)}
          </p>
        )}
      </div>

      <LessonPlayer
        lessonId={lesson.id}
        watermark={watermarkLabel}
        videoUrl={lesson.videoUrl}
        provider={lesson.provider}
        watchedSeconds={lesson.watchedSeconds}
        completed={lesson.completed}
        entitled={entitled}
      />

      {lesson.description && (
        <Card className="p-5">
          <h2 className="mb-2 text-base font-semibold text-ink">عن الدرس</h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-ink-muted">
            {lesson.description}
          </p>
        </Card>
      )}

      <nav aria-label="التنقّل بين الدروس" className="flex items-center justify-between gap-3">
        {lesson.prevId ? (
          <Link
            href={`/student/courses/${slug}/lessons/${lesson.prevId}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-field)] border border-border-strong bg-surface px-4 text-base hover:bg-surface-muted"
          >
            <ChevronRight className="size-4" aria-hidden />
            الدرس السابق
          </Link>
        ) : (
          <span />
        )}

        {lesson.nextId ? (
          <Link
            href={`/student/courses/${slug}/lessons/${lesson.nextId}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-field)] bg-brand-700 px-4 text-base font-medium text-ink-invert hover:bg-brand-800"
          >
            الدرس التالي
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
