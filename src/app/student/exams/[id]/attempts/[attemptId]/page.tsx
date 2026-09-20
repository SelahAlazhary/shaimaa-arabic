import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, XCircle, Circle, Lightbulb } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { getAttemptReview } from '@/lib/queries/attempt-review'
import { Card, Badge } from '@/components/ui/card'
import { formatNumber, formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export const metadata: Metadata = { title: 'مراجعة المحاولة' }

export default async function AttemptReviewPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>
}) {
  await requireStudent()
  const { id, attemptId } = await params

  // الدالة ترفض المحاولة غير المُسلَّمة أو غير المملوكة، فالفشل يعني «غير متاح»
  const review = await getAttemptReview(attemptId)
  if (!review) notFound()

  return (
    <div className="space-y-5">
      <Link
        href={`/student/exams`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        كل الاختبارات
      </Link>

      <Card className="p-6 text-center">
        <h1 className="text-base font-semibold text-ink">{review.examTitle}</h1>
        <p className="nums-ar mt-3 text-3xl font-semibold text-ink">
          {formatNumber(Math.round(review.percentage))}٪
        </p>
        <p className="nums-ar mt-1 text-sm text-ink-muted">
          {formatNumber(review.score)} من {formatNumber(review.maxScore)} درجة
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge tone={review.passed ? 'success' : 'warning'}>
            {review.passed ? 'ناجح' : 'لم تجتز'}
          </Badge>
          <span className="nums-ar text-xs text-ink-faint">
            {formatDateTime(review.submittedAt)}
          </span>
        </div>
      </Card>

      <ol className="space-y-4">
        {review.questions.map((q, i) => {
          const chosen = new Set(q.chosen_ids)

          return (
            <li key={q.id}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed text-ink">
                    <span className="nums-ar text-ink-faint">{formatNumber(i + 1)}. </span>
                    {q.question_text}
                  </p>
                  <span
                    className={cn(
                      'nums-ar flex shrink-0 items-center gap-1.5 text-xs font-medium',
                      q.is_correct ? 'text-success' : 'text-danger',
                    )}
                  >
                    {q.is_correct ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : (
                      <XCircle className="size-4" aria-hidden />
                    )}
                    {formatNumber(Number(q.earned))} / {formatNumber(Number(q.points))}
                  </span>
                </div>

                {q.question_type === 'short_answer' ? (
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-ink-faint">إجابتك:</dt>
                      <dd className={q.is_correct ? 'text-success' : 'text-danger'}>
                        {q.answer_text?.trim() || 'لم تجب'}
                      </dd>
                    </div>
                    {!q.is_correct && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-ink-faint">الصحيحة:</dt>
                        <dd className="text-success">{q.correct_text}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {q.options.map((o) => {
                      const picked = chosen.has(o.id)
                      // أربع حالات: صحيحة اخترتها · صحيحة فوّتّها · خاطئة اخترتها · محايدة
                      const tone = o.is_correct
                        ? 'text-success'
                        : picked
                          ? 'text-danger'
                          : 'text-ink-muted'

                      return (
                        <li key={o.id} className={cn('flex items-center gap-2 text-sm', tone)}>
                          {o.is_correct ? (
                            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                          ) : picked ? (
                            <XCircle className="size-4 shrink-0" aria-hidden />
                          ) : (
                            <Circle className="size-4 shrink-0 opacity-40" aria-hidden />
                          )}
                          <span>{o.option_text}</span>
                          {picked && (
                            <span className="text-xs text-ink-faint">(اخترتها)</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {q.explanation && (
                  <p className="mt-3 flex items-start gap-2 rounded-[var(--radius-field)] bg-info-bg p-3 text-sm leading-relaxed text-info">
                    <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {q.explanation}
                  </p>
                )}
              </Card>
            </li>
          )
        })}
      </ol>

      <Link
        href={`/student/exams/${id}`}
        className="inline-flex h-11 items-center rounded-[var(--radius-field)] border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
      >
        صفحة الاختبار
      </Link>
    </div>
  )
}
