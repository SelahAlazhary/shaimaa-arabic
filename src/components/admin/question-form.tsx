'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Plus, AlertCircle, Trash2, Lock, Save } from 'lucide-react'
import { addQuestion, updateQuestion, type ExamState } from '@/lib/mutations/exams'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: ExamState = { status: 'idle' }

const TYPES = [
  { value: 'single_choice', label: 'اختيار من متعدد — إجابة واحدة' },
  { value: 'multiple_choice', label: 'اختيار من متعدد — أكثر من إجابة' },
  { value: 'true_false', label: 'صح أو خطأ' },
  { value: 'short_answer', label: 'إجابة قصيرة' },
] as const

type QuestionType = (typeof TYPES)[number]['value']

export type QuestionDefaults = {
  id: string
  questionText: string
  questionType: QuestionType
  points: string
  correctText: string
  explanation: string
  options: { text: string; isCorrect: boolean }[]
}

const EMPTY_OPTIONS = ['', '', '', '']
const TF_OPTIONS = ['صح', 'خطأ']

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText={editing ? 'جارٍ الحفظ…' : 'جارٍ الإضافة…'}>
      {editing ? <Save aria-hidden /> : <Plus aria-hidden />}
      {editing ? 'حفظ التعديل' : 'إضافة السؤال'}
    </Button>
  )
}

export function QuestionForm({
  examId,
  question,
  locked = false,
  onDone,
}: {
  examId: string
  /** موجود ⇐ وضع التعديل */
  question?: QuestionDefaults
  /** الاختبار بدأه طلاب: البنية مقفلة والنصوص فقط قابلة للتصحيح */
  locked?: boolean
  onDone?: () => void
}) {
  const editing = Boolean(question)
  const [state, formAction] = useActionState(editing ? updateQuestion : addQuestion, initial)

  const [type, setType] = useState<QuestionType>(question?.questionType ?? 'single_choice')
  const [questionText, setQuestionText] = useState(question?.questionText ?? '')
  const [points, setPoints] = useState(question?.points ?? '1')
  const [correctText, setCorrectText] = useState(question?.correctText ?? '')
  const [explanation, setExplanation] = useState(question?.explanation ?? '')
  const [options, setOptions] = useState<string[]>(
    question ? question.options.map((o) => o.text) : EMPTY_OPTIONS,
  )
  const [correct, setCorrect] = useState<number[]>(
    question ? question.options.flatMap((o, i) => (o.isCorrect ? [i] : [])) : [],
  )
  const [formKey, setFormKey] = useState(0)

  const reset = () => {
    setQuestionText('')
    setCorrectText('')
    setExplanation('')
    setOptions(type === 'true_false' ? TF_OPTIONS : EMPTY_OPTIONS)
    setCorrect([])
    setFormKey((k) => k + 1)
  }

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message)
      if (editing) onDone?.()
      else reset()
    }
    // React يعيد ضبط النموذج بعد كل Server Action، فالـ key يُعيد بناء
    // الحقول بقيم الحالة المحفوظة بدل أن تعود فارغة (البند 12)
    if (state.status === 'error') setFormKey((k) => k + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // صح/خطأ خياراه ثابتان — كتابتهما يدويًا مصدر أخطاء بلا فائدة
  const onTypeChange = (next: QuestionType) => {
    const isPlainChoice = (t: QuestionType) => t === 'single_choice' || t === 'multiple_choice'
    // التنقّل بين «إجابة واحدة» و«أكثر من إجابة» لا يغيّر الخيارات،
    // فمسحها هنا يضيّع ما كتبه المحرّر بلا سبب
    const keepOptions = isPlainChoice(type) && isPlainChoice(next)

    setType(next)
    if (!keepOptions) {
      setOptions(next === 'true_false' ? TF_OPTIONS : EMPTY_OPTIONS)
      setCorrect([])
    } else if (next === 'single_choice') {
      // النوع الجديد يقبل صحيحة واحدة: نُبقي الأولى ونُسقط الباقي
      setCorrect((prev) => prev.slice(0, 1))
    }
    setFormKey((k) => k + 1)
  }

  const toggleCorrect = (i: number) => {
    setCorrect((prev) => {
      if (type === 'multiple_choice') {
        return prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
      }
      return prev.includes(i) ? [] : [i]
    })
  }

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  const isChoice = type !== 'short_answer'
  const lockedOptions = type === 'true_false' || locked

  return (
    <form key={formKey} action={formAction} className="space-y-4 p-5" noValidate>
      {editing ? (
        <input type="hidden" name="questionId" value={question!.id} />
      ) : (
        <input type="hidden" name="examId" value={examId} />
      )}

      {locked && (
        <p className="flex items-start gap-2 rounded-[var(--radius-field)] bg-warning-bg px-3.5 py-3 text-base leading-relaxed text-warning">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          بدأ طلاب هذا الاختبار بالفعل. التصحيح متاح لصياغة السؤال والخيارات فقط — النوع
          والدرجة والإجابة الصحيحة مقفلة حتى لا تتغيّر نتائج مسجَّلة.
        </p>
      )}

      {generalError && (
        <p role="alert" className="flex items-center gap-1.5 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {generalError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="نوع السؤال" required>
          {({ id }) => (
            <Select
              id={id}
              name="questionType"
              value={type}
              onChange={(e) => onTypeChange(e.target.value as QuestionType)}
              disabled={locked}
              required
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="الدرجة" error={fieldErrors?.points} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="points"
              value={points}
              onChange={(e) => setPoints(e.target.value.replace(/\D/g, '').slice(0, 3))}
              inputMode="numeric"
              dir="ltr"
              className="text-start"
              aria-describedby={describedBy}
              invalid={invalid}
              readOnly={locked}
              required
            />
          )}
        </Field>
      </div>

      {/* الحقل معطَّل لا يُرسَل مع النموذج، فنرسل القيمة المقفلة صراحةً */}
      {locked && <input type="hidden" name="questionType" value={type} />}

      <Field label="نص السؤال" error={fieldErrors?.questionText} required>
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            name="questionText"
            rows={2}
            maxLength={1000}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            placeholder="مثال: ما إعراب كلمة «العلمُ» في قولنا: العلمُ نورٌ؟"
            className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-faint hover:border-ink-faint"
            required
          />
        )}
      </Field>

      {isChoice ? (
        <fieldset>
          <legend className="mb-2 text-base font-medium text-ink">
            الخيارات
            <span className="ms-2 text-sm font-normal text-ink-faint">
              {type === 'multiple_choice'
                ? 'علّم كل الإجابات الصحيحة'
                : 'علّم الإجابة الصحيحة الواحدة'}
            </span>
          </legend>

          <ul className="space-y-2">
            {options.map((value, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <input
                  type={type === 'multiple_choice' ? 'checkbox' : 'radio'}
                  name="correct"
                  value={i}
                  checked={correct.includes(i)}
                  onChange={() => toggleCorrect(i)}
                  disabled={locked}
                  aria-label={`الخيار ${i + 1} صحيح`}
                  className="size-4 shrink-0 border-border-strong"
                />
                <input
                  name="option"
                  value={value}
                  onChange={(e) => setOption(i, e.target.value)}
                  readOnly={type === 'true_false'}
                  placeholder={`الخيار ${i + 1}`}
                  aria-label={`نص الخيار ${i + 1}`}
                  className={[
                    'h-11 flex-1 rounded-[var(--radius-field)] border bg-surface px-3.5 text-base text-ink',
                    'placeholder:text-ink-faint border-border-strong hover:border-ink-faint',
                    type === 'true_false' ? 'bg-surface-muted' : '',
                  ].join(' ')}
                />
                {!lockedOptions && options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setOptions((p) => p.filter((_, idx) => idx !== i))
                      setCorrect((p) => p.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)))
                    }}
                    className="tap-target grid shrink-0 place-items-center text-ink-faint hover:text-danger"
                    aria-label={`حذف الخيار ${i + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* الصح المقفل معطَّل فلا يُرسَل؛ نرسله يدويًا حتى لا يبدو تغييرًا بنيويًا */}
          {locked &&
            correct.map((i) => <input key={i} type="hidden" name="correct" value={i} />)}

          {!lockedOptions && options.length < 6 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setOptions((p) => [...p, ''])}
            >
              <Plus aria-hidden />
              خيار آخر
            </Button>
          )}
        </fieldset>
      ) : (
        <Field
          label="الإجابة الصحيحة"
          error={fieldErrors?.correctText}
          hint="تُقارَن بعد تجاهل التشكيل واختلاف الألف والياء والتاء المربوطة"
          required
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="correctText"
              value={correctText}
              onChange={(e) => setCorrectText(e.target.value)}
              placeholder="مثال: مبتدأ مرفوع"
              aria-describedby={describedBy}
              invalid={invalid}
              readOnly={locked}
              required
            />
          )}
        </Field>
      )}

      <Field
        label="شرح الإجابة"
        error={fieldErrors?.explanation}
        hint="اختياري — يظهر للطالب في صفحة مراجعة إجاباته بعد التسليم"
      >
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            name="explanation"
            rows={2}
            maxLength={500}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            placeholder="مثال: «العلمُ» مبتدأ مرفوع وعلامة رفعه الضمة الظاهرة."
            className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-faint hover:border-ink-faint"
          />
        )}
      </Field>

      <div className="flex flex-wrap gap-2.5">
        <SubmitButton editing={editing} />
        {editing && (
          <Button type="button" variant="secondary" onClick={onDone}>
            إلغاء
          </Button>
        )}
      </div>
    </form>
  )
}
