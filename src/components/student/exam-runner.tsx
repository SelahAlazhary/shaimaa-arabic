'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Timer, AlertCircle, CheckCircle2, XCircle, Send } from 'lucide-react'
import {
  startAttempt,
  getAttemptQuestions,
  submitAttempt,
  type AttemptPayload,
  type SubmitResult,
} from '@/lib/mutations/attempts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

type Answers = Record<string, { optionIds: string[]; text: string }>

/** المتبقّي يُحسب من فارق ساعة الخادم لا من ساعة الجهاز (البند 20). */
function useServerClock(expiresAt: string | null, serverNow: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!expiresAt || !serverNow) {
      setRemaining(null)
      return
    }

    // الفارق بين ساعة الجهاز وساعة الخادم يُقاس مرة ويُطبَّق دائمًا
    const drift = Date.now() - new Date(serverNow).getTime()
    const end = new Date(expiresAt).getTime()

    const tick = () => setRemaining(Math.max(0, Math.floor((end - (Date.now() - drift)) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, serverNow])

  return remaining
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${formatNumber(m)}:${String(s).padStart(2, '0').replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)] ?? d)}`
}

export function ExamRunner({
  examId,
  examTitle,
  hasTimer,
}: {
  examId: string
  examTitle: string
  hasTimer: boolean
}) {
  const router = useRouter()
  const [payload, setPayload] = useState<AttemptPayload | null>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult] = useState<SubmitResult | null>(null)
  // يبقى بعد مسح payload: رابط المراجعة يحتاجه
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const autoSubmitted = useRef(false)

  const remaining = useServerClock(payload?.expiresAt ?? null, payload?.serverNow ?? null)

  const begin = () =>
    startTransition(async () => {
      setError(null)
      const started = await startAttempt(examId)
      if (started.status !== 'started') {
        setError(started.status === 'error' ? started.message : 'تعذّر بدء الاختبار. أعد المحاولة.')
        return
      }
      const loaded = await getAttemptQuestions(started.attemptId)
      if (!loaded.ok) {
        setError(loaded.message)
        return
      }
      setAttemptId(started.attemptId)
      setPayload(loaded.payload)
    })

  const send = useCallback(
    async (auto: boolean) => {
      if (!payload || submitting) return
      setSubmitting(true)

      const body = payload.questions.map((q) => {
        const a = answers[q.id]
        return q.question_type === 'short_answer'
          ? { question_id: q.id, answer_text: a?.text ?? '' }
          : { question_id: q.id, option_ids: a?.optionIds ?? [] }
      })

      const res = await submitAttempt(payload.attemptId, body)
      setSubmitting(false)

      if (res.status === 'error') {
        toast.error(res.message)
        setError(res.message)
        return
      }

      setResult(res)
      if (auto) toast.info('انتهى الوقت وسُلِّم الاختبار تلقائيًا.')
      router.refresh()
    },
    [payload, answers, submitting, router],
  )

  // انتهاء الوقت يُسلّم تلقائيًا: ترك الطالب أمام شاشة ميتة يضيّع إجاباته
  useEffect(() => {
    if (remaining === 0 && payload && !result && !autoSubmitted.current) {
      autoSubmitted.current = true
      void send(true)
    }
  }, [remaining, payload, result, send])

  const pick = (q: AttemptPayload['questions'][number], optionId: string) =>
    setAnswers((prev) => {
      const cur = prev[q.id]?.optionIds ?? []
      const next =
        q.question_type === 'multiple_choice'
          ? cur.includes(optionId)
            ? cur.filter((x) => x !== optionId)
            : [...cur, optionId]
          : [optionId]
      return { ...prev, [q.id]: { optionIds: next, text: prev[q.id]?.text ?? '' } }
    })

  const write = (questionId: string, text: string) =>
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { optionIds: prev[questionId]?.optionIds ?? [], text },
    }))

  // ===== النتيجة =====
  if (result && result.status === 'done') {
    return (
      <Card className="p-8 text-center">
        <span
          className={cn(
            'mx-auto mb-4 grid size-14 place-items-center rounded-full',
            result.passed ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning',
          )}
        >
          {result.passed ? (
            <CheckCircle2 className="size-7" aria-hidden />
          ) : (
            <XCircle className="size-7" aria-hidden />
          )}
        </span>

        <h2 className="text-lg font-semibold text-ink">
          {result.passed ? 'نجحت، مبروك' : 'لم تجتز الاختبار'}
        </h2>

        <p className="nums-ar mt-2 text-3xl font-semibold text-ink">
          {formatNumber(Math.round(result.percentage))}٪
        </p>
        <p className="nums-ar mt-1 text-base text-ink-muted">
          {formatNumber(result.score)} من {formatNumber(result.maxScore)} درجة
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => router.push(`/student/exams/${examId}/attempts/${attemptId}`)}>
            راجع إجاباتك
          </Button>
          <Button variant="secondary" onClick={() => router.push('/student/exams')}>
            كل الاختبارات
          </Button>
        </div>
      </Card>
    )
  }

  // ===== قبل البدء =====
  if (!payload) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-lg font-semibold text-ink">{examTitle}</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-muted">
          {hasTimer
            ? 'المؤقّت يبدأ فور الضغط ولا يتوقّف. تأكّد أنك جاهز قبل البدء.'
            : 'لا مؤقّت في هذا الاختبار، لكن المحاولة تُحتسب فور البدء.'}
        </p>

        {error && (
          <p role="alert" className="mt-4 flex items-center justify-center gap-1.5 text-base text-danger">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <div className="mt-6">
          <Button size="lg" loading={starting} loadingText="جارٍ التحضير…" onClick={begin}>
            ابدأ الاختبار
          </Button>
        </div>
      </Card>
    )
  }

  // ===== أثناء الاختبار =====
  const answeredCount = payload.questions.filter((q) => {
    const a = answers[q.id]
    return q.question_type === 'short_answer'
      ? Boolean(a?.text.trim())
      : (a?.optionIds.length ?? 0) > 0
  }).length

  const lowTime = remaining !== null && remaining <= 60

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-20 flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
        <p className="nums-ar text-base text-ink-muted">
          أجبت {formatNumber(answeredCount)} من {formatNumber(payload.questions.length)}
        </p>

        {remaining !== null && (
          <p
            className={cn(
              'nums-ar flex items-center gap-1.5 text-base font-medium tabular-nums',
              lowTime ? 'text-danger' : 'text-ink',
            )}
            role="timer"
            aria-live={lowTime ? 'assertive' : 'off'}
          >
            <Timer className="size-4" aria-hidden />
            {formatClock(remaining)}
          </p>
        )}
      </div>

      <ol className="space-y-4">
        {payload.questions.map((q, i) => (
          <li key={q.id}>
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-base leading-relaxed text-ink">
                  <span className="nums-ar text-ink-faint">{formatNumber(i + 1)}. </span>
                  {q.question_text}
                </p>
                <span className="nums-ar shrink-0 text-sm text-ink-faint">
                  {formatNumber(Number(q.points))} درجة
                </span>
              </div>

              {q.question_type === 'short_answer' ? (
                <input
                  value={answers[q.id]?.text ?? ''}
                  onChange={(e) => write(q.id, e.target.value)}
                  aria-label={`إجابة السؤال ${i + 1}`}
                  placeholder="اكتب إجابتك"
                  className="mt-3 h-11 w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 text-base text-ink placeholder:text-ink-faint hover:border-ink-faint"
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {q.options.map((o) => {
                    const chosen = (answers[q.id]?.optionIds ?? []).includes(o.id)
                    return (
                      <li key={o.id}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-field)] border p-3 transition-colors',
                            chosen
                              ? 'border-brand-600 bg-brand-50'
                              : 'border-border-subtle hover:border-border-strong hover:bg-surface-muted',
                          )}
                        >
                          <input
                            type={q.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                            name={`q-${q.id}`}
                            checked={chosen}
                            onChange={() => pick(q, o.id)}
                            className="size-4 shrink-0 border-border-strong"
                          />
                          <span className="text-base text-ink">{o.option_text}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </li>
        ))}
      </ol>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Card className="p-5">
        <p className="mb-3 text-base text-ink-muted">
          راجع إجاباتك قبل التسليم، فلا تعديل بعده.
        </p>
        <Button
          size="lg"
          block
          loading={submitting}
          loadingText="جارٍ التسليم…"
          onClick={() => void send(false)}
        >
          <Send aria-hidden />
          تسليم الاختبار
        </Button>
      </Card>
    </div>
  )
}
