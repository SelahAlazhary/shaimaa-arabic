import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight, PlayCircle, CheckCircle2, Lock, FileText, Clock, CalendarClock, Download,
} from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { getCourseOutline } from '@/lib/queries/course'
import { Card, CardHeader, EmptyState, ProgressBar, Badge } from '@/components/ui/card'
import { formatNumber, formatDuration, formatDate, formatFileSize } from '@/lib/utils/format'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourseOutline(slug)
  return { title: course?.title ?? 'الكورس' }
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireStudent()
  const { slug } = await params
  const course = await getCourseOutline(slug)

  if (!course) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-1.5 text-base text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        كل الكورسات
      </Link>

      <section className="rounded-[var(--radius-panel)] bg-brand-700 px-6 py-7 text-ink-invert sm:px-8">
        {course.gradeName && <p className="text-sm text-brand-200">{course.gradeName}</p>}
        <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{course.title}</h1>
        {course.description && (
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-brand-100">
            {course.description}
          </p>
        )}

        <div className="nums-ar mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-brand-100">
          <span>{formatNumber(course.totalLessons)} درس</span>
          <span>
            أكملت {formatNumber(course.completedLessons)} ({formatNumber(course.percent)}٪)
          </span>
          {course.expiresAt && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" aria-hidden />
              ينتهي {formatDate(course.expiresAt)}
            </span>
          )}
        </div>

        {!course.enrolled && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-field)] bg-brand-800 px-3.5 py-2 text-base">
            <Lock className="size-4" aria-hidden />
            غير مشترك — الدروس المجانية فقط متاحة لك
          </p>
        )}
      </section>

      {course.modules.map((m) => (
        <Card key={m.id ?? 'loose'}>
          <CardHeader
            title={m.title}
            icon={PlayCircle}
            action={
              <span className="nums-ar text-sm text-ink-faint">
                {formatNumber(m.lessons.length)} درس
              </span>
            }
          />

          {m.lessons.length === 0 ? (
            <EmptyState
              icon={PlayCircle}
              title="لا دروس في هذه الوحدة"
              description="سيظهر محتوى الوحدة فور نشره."
            />
          ) : (
            <ol className="divide-y divide-border-subtle">
              {m.lessons.map((l, i) => {
                const locked = !course.enrolled && !l.isFree
                return (
                  <li key={l.id}>
                    <Link
                      href={`/student/courses/${course.slug}/lessons/${l.id}`}
                      className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-muted"
                    >
                      <span
                        className={[
                          'nums-ar mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-medium',
                          l.completed
                            ? 'bg-success-bg text-success'
                            : locked
                              ? 'bg-surface-muted text-ink-faint'
                              : 'bg-brand-50 text-brand-700',
                        ].join(' ')}
                      >
                        {l.completed ? (
                          <CheckCircle2 className="size-4" aria-hidden />
                        ) : locked ? (
                          <Lock className="size-3.5" aria-hidden />
                        ) : (
                          formatNumber(i + 1)
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-medium text-ink">{l.title}</span>
                          {l.isFree && <Badge tone="info">مجاني</Badge>}
                        </span>
                        {l.durationSeconds > 0 && (
                          <span className="nums-ar mt-1 flex items-center gap-1.5 text-sm text-ink-faint">
                            <Clock className="size-3.5" aria-hidden />
                            {formatDuration(l.durationSeconds)}
                          </span>
                        )}
                        {!l.completed && l.progressPercent > 0 && (
                          <span className="mt-2 block">
                            <ProgressBar value={l.progressPercent} label={`تقدّمك في ${l.title}`} />
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      ))}

      <Card>
        <CardHeader title="مرفقات الكورس" icon={FileText} />
        {course.attachments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="لا توجد مرفقات"
            description="الملازم والمذكرات المرتبطة بالكورس هتظهر هنا."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {course.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={`/attachments/${a.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-base font-medium text-ink">{a.title}</span>
                    <span className="nums-ar mt-0.5 block text-sm text-ink-faint">
                      {formatFileSize(a.fileSize)}
                    </span>
                  </span>
                  <Download className="size-4 shrink-0 text-ink-faint" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
