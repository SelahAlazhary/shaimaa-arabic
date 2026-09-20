'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { AlertCircle, Save, Eye, EyeOff } from 'lucide-react'
import { saveExam, toggleExamPublished, type ExamState } from '@/lib/mutations/exams'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: ExamState = { status: 'idle' }

export type ExamDefaults = {
  id?: string
  courseId: string
  title: string
  description: string
  durationMinutes: string
  passingPercentage: string
  maxAttempts: string
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الحفظ…">
      <Save aria-hidden />
      {editing ? 'حفظ التعديلات' : 'إنشاء الاختبار'}
    </Button>
  )
}

export function ExamForm({
  courses,
  defaults,
}: {
  courses: { id: string; title: string }[]
  defaults?: ExamDefaults
}) {
  const [state, formAction] = useActionState(saveExam, initial)
  const editing = Boolean(defaults?.id)

  const [values, setValues] = useState({
    courseId: defaults?.courseId ?? '',
    title: defaults?.title ?? '',
    description: defaults?.description ?? '',
    durationMinutes: defaults?.durationMinutes ?? '',
    passingPercentage: defaults?.passingPercentage ?? '50',
    maxAttempts: defaults?.maxAttempts ?? '',
  })

  const [formKey, setFormKey] = useState(0)
  useEffect(() => {
    if (state.status === 'error') setFormKey((k) => k + 1)
    if (state.status === 'success') toast.success(state.message)
  }, [state])

  const set = (k: keyof typeof values, v: string) => setValues((p) => ({ ...p, [k]: v }))
  const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max)

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form key={formKey} action={formAction} className="space-y-4 p-5" noValidate>
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      {generalError && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {generalError}
        </p>
      )}

      <Field label="عنوان الاختبار" error={fieldErrors?.title} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="title"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="مثال: اختبار الأسبوع الأول — المرفوعات"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <Field label="الكورس" error={fieldErrors?.courseId} hint="اتركه فارغًا ليتاح لكل الطلاب">
        {({ id, describedBy, invalid }) => (
          <Select
            id={id}
            name="courseId"
            value={values.courseId}
            onChange={(e) => set('courseId', e.target.value)}
            aria-describedby={describedBy}
            invalid={invalid}
          >
            <option value="">كل الطلاب</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="المدة بالدقائق" error={fieldErrors?.durationMinutes} hint="فارغ = بلا مؤقّت">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="durationMinutes"
              value={values.durationMinutes}
              onChange={(e) => set('durationMinutes', digits(e.target.value, 3))}
              inputMode="numeric"
              dir="ltr"
              className="text-start"
              placeholder="60"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Field label="نسبة النجاح ٪" error={fieldErrors?.passingPercentage} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="passingPercentage"
              value={values.passingPercentage}
              onChange={(e) => set('passingPercentage', digits(e.target.value, 3))}
              inputMode="numeric"
              dir="ltr"
              className="text-start"
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
          )}
        </Field>

        <Field label="عدد المحاولات" error={fieldErrors?.maxAttempts} hint="فارغ = بلا حد">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="maxAttempts"
              value={values.maxAttempts}
              onChange={(e) => set('maxAttempts', digits(e.target.value, 2))}
              inputMode="numeric"
              dir="ltr"
              className="text-start"
              placeholder="1"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>
      </div>

      <Field label="وصف الاختبار" error={fieldErrors?.description}>
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            name="description"
            rows={2}
            maxLength={1000}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            placeholder="تعليمات يراها الطالب قبل البدء."
            className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint hover:border-ink-faint"
          />
        )}
      </Field>

      <SubmitButton editing={editing} />
    </form>
  )
}

/** النشر مشروط بوجود سؤال — الشرط يُفحص في الخادم والرسالة تعود منه. */
export function ExamPublishToggle({
  examId,
  published,
}: {
  examId: string
  published: boolean
}) {
  const [pending, start] = useTransition()

  const toggle = () =>
    start(async () => {
      const res = await toggleExamPublished(examId, !published)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  return (
    <Button variant={published ? 'secondary' : 'primary'} loading={pending} onClick={toggle}>
      {!pending && (published ? <EyeOff aria-hidden /> : <Eye aria-hidden />)}
      {published ? 'إخفاء الاختبار' : 'نشر الاختبار'}
    </Button>
  )
}
