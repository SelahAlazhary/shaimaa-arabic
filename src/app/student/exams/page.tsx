import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, Timer, Repeat2, Target, ArrowLeft } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber, formatDateTime } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'الاختبارات' }

export default async function StudentExamsPage() {
  await requireStudent()
  const supabase = await createClient()

  // RLS تُظهر المنشور فقط ولمقررات الطالب المسجَّل فيها — لا فلترة يدوية هنا
  const [examsRes, attemptsRes] = await Promise.all([
    supabase
      .from('exams')
      .select('id, title, description, duration_minutes, passing_percentage, max_attempts, starts_at, ends_at, courses(title)')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('exam_attempts')
      .select('id, exam_id, status, percentage, passed, submitted_at')
      .eq('status', 'submitted'),
  ])

  const exams = (examsRes.data ?? []) as unknown as {
    id: string
    title: string
    description: string | null
    duration_minutes: number | null
    passing_percentage: number
    max_attempts: number | null
    starts_at: string | null
    ends_at: string | null
    courses: { title: string } | null
  }[]

  const attempts = attemptsRes.data ?? []
  const now = Date.now()

  // المراجعة تُفتح على أعلى نتيجة: هي ما يعنيه الطالب حين يسأل «فين غلطت؟»
  const bestFor = (examId: string) => {
    const mine = attempts.filter((a) => a.exam_id === examId)
    if (mine.length === 0) return null
    return mine.reduce((best, a) => ((a.percentage ?? 0) > (best.percentage ?? 0) ? a : best))
  }

  const windowState = (starts: string | null, ends: string | null) => {
    if (starts && now < new Date(starts).getTime()) return 'upcoming' as const
    if (ends && now > new Date(ends).getTime()) return 'ended' as const
    return 'open' as const
  }

  return (
    <div>
      <PageHeader
        title="الاختبارات"
        description="اختباراتك المتاحة ونتائج محاولاتك السابقة."
      />

      <Card>
        <CardHeader title="الاختبارات المتاحة" icon={ClipboardList} />

        {exams.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="لا توجد اختبارات متاحة"
            description="تظهر اختباراتك هنا بعد فتح مقرر ونشر اختباراته."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {exams.map((e) => {
              const best = bestFor(e.id)
              const state = windowState(e.starts_at, e.ends_at)

              return (
                <li key={e.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-medium text-ink">{e.title}</p>
                      {e.courses?.title && (
                        <p className="mt-0.5 text-sm text-ink-muted">{e.courses.title}</p>
                      )}
                    </div>

                    <Badge
                      tone={state === 'open' ? 'success' : state === 'upcoming' ? 'info' : 'neutral'}
                    >
                      {state === 'open' ? 'متاح الآن' : state === 'upcoming' ? 'لم يبدأ' : 'انتهى'}
                    </Badge>
                  </div>

                  {e.description && (
                    <p className="mt-1.5 text-base leading-relaxed text-ink-muted">{e.description}</p>
                  )}

                  <ul className="nums-ar mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-faint">
                    <li className="flex items-center gap-1.5">
                      <Timer className="size-3.5" aria-hidden />
                      {e.duration_minutes ? `${formatNumber(e.duration_minutes)} دقيقة` : 'بدون مؤقّت'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Target className="size-3.5" aria-hidden />
                      النجاح {formatNumber(Math.round(e.passing_percentage))}٪
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Repeat2 className="size-3.5" aria-hidden />
                      {e.max_attempts ? `${formatNumber(e.max_attempts)} محاولة` : 'محاولات غير محدودة'}
                    </li>
                    {e.starts_at && state === 'upcoming' && (
                      <li>يبدأ {formatDateTime(e.starts_at)}</li>
                    )}
                  </ul>

                  {state === 'open' && (
                    <Link
                      href={`/student/exams/${e.id}`}
                      className="mt-3 inline-flex h-10 items-center gap-2 rounded-[var(--radius-field)] bg-brand-700 px-4 text-base font-medium text-ink-invert transition-colors hover:bg-brand-800"
                    >
                      {best ? 'محاولة جديدة' : 'ابدأ الاختبار'}
                      <ArrowLeft className="size-3.5" aria-hidden />
                    </Link>
                  )}

                  <p className="nums-ar mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {best ? (
                      <>
                        <span className={best.passed ? 'text-success' : 'text-warning'}>
                          أعلى نتيجة {formatNumber(Math.round(best.percentage ?? 0))}٪ ·{' '}
                          {best.passed ? 'ناجح' : 'لم تجتز بعد'}
                        </span>
                        <Link
                          href={`/student/exams/${e.id}/attempts/${best.id}`}
                          className="text-brand-600 underline-offset-4 hover:underline"
                        >
                          راجع إجاباتك
                        </Link>
                      </>
                    ) : (
                      <span className="text-ink-faint">لم تُجرِ محاولة بعد</span>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
