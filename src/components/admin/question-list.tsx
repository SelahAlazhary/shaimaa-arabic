'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  ListChecks,
  Lightbulb,
} from 'lucide-react'
import { deleteQuestion, moveQuestion } from '@/lib/mutations/exams'
import { QuestionForm, type QuestionDefaults } from '@/components/admin/question-form'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { EmptyState, Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils/format'

const TYPE_LABELS = {
  single_choice: 'اختيار واحد',
  multiple_choice: 'اختيار متعدد',
  true_false: 'صح أو خطأ',
  short_answer: 'إجابة قصيرة',
} as const

export function QuestionList({
  examId,
  questions,
  locked,
}: {
  examId: string
  questions: QuestionDefaults[]
  locked: boolean
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [moving, startMove] = useTransition()

  const move = (id: string, direction: 'up' | 'down') =>
    startMove(async () => {
      const res = await moveQuestion(id, direction)
      if (!res.ok) toast.error(res.message)
    })

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="لا أسئلة بعد"
        description="أضف أول سؤال من النموذج بالأعلى، وسيظهر هنا فورًا."
      />
    )
  }

  return (
    <ol className="divide-y divide-border-subtle">
      {questions.map((q, i) => {
        if (editing === q.id) {
          return (
            <li key={q.id} className="bg-surface-muted">
              <QuestionForm
                examId={examId}
                question={q}
                locked={locked}
                onDone={() => setEditing(null)}
              />
            </li>
          )
        }

        return (
          <li key={q.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-base text-ink">
                <span className="nums-ar text-ink-faint">{formatNumber(i + 1)}. </span>
                {q.questionText}
              </p>
              <span className="flex shrink-0 items-center gap-2">
                <Badge tone="neutral">{TYPE_LABELS[q.questionType]}</Badge>
                <span className="nums-ar text-sm text-ink-faint">
                  {formatNumber(Number(q.points))} درجة
                </span>
              </span>
            </div>

            {q.questionType === 'short_answer' ? (
              <p className="mt-2 flex items-center gap-1.5 text-base text-success">
                <CheckCircle2 className="size-3.5" aria-hidden />
                {q.correctText}
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {q.options.map((o, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-1.5 text-base ${
                      o.isCorrect ? 'text-success' : 'text-ink-muted'
                    }`}
                  >
                    {o.isCorrect ? (
                      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                    ) : (
                      <span className="size-3.5 shrink-0" />
                    )}
                    {o.text}
                  </li>
                ))}
              </ul>
            )}

            {q.explanation && (
              <p className="mt-2 flex items-start gap-1.5 text-sm leading-relaxed text-ink-faint">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {q.explanation}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1">
              {/*
               * أزرار لا سحب: السحب لا يعمل بلوحة المفاتيح ولا على اللمس
               * بثقة، والترتيب هنا قائمة قصيرة (البند 22).
               */}
              <Button
                variant="ghost"
                size="sm"
                disabled={i === 0 || moving}
                onClick={() => move(q.id, 'up')}
                aria-label={`تقديم السؤال ${i + 1}`}
              >
                <ChevronUp aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={i === questions.length - 1 || moving}
                onClick={() => move(q.id, 'down')}
                aria-label={`تأخير السؤال ${i + 1}`}
              >
                <ChevronDown aria-hidden />
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setEditing(q.id)}>
                <Pencil aria-hidden />
                تعديل
              </Button>

              {!locked && (
                <ConfirmButton
                  label="حذف"
                  icon={<Trash2 aria-hidden />}
                  title="حذف السؤال؟"
                  body={`سيُحذف السؤال «${q.questionText.slice(0, 60)}» وخياراته نهائيًا. لا يمكن التراجع.`}
                  confirmLabel="احذف السؤال"
                  action={() => deleteQuestion(q.id)}
                />
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
