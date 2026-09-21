'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Send, AlertCircle } from 'lucide-react'
import { sendAnnouncement, type AnnounceState } from '@/lib/mutations/announce'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: AnnounceState = { status: 'idle' }

type Option = { id: string; label: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الإرسال…">
      <Send aria-hidden />
      أرسل الإشعار
    </Button>
  )
}

export function AnnounceForm({
  grades,
  courses,
}: {
  grades: Option[]
  courses: Option[]
}) {
  const [state, formAction] = useActionState(sendAnnouncement, initial)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [audience, setAudience] = useState<'all' | 'grade' | 'course'>('all')
  const [gradeId, setGradeId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message)
      setTitle('')
      setBody('')
      setLink('')
      setFormKey((k) => k + 1)
    }
    if (state.status === 'error') {
      if (!state.fieldErrors) toast.error(state.message)
      setFormKey((k) => k + 1)
    }
  }, [state])

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form key={formKey} action={formAction} className="space-y-4 p-5" noValidate>
      <p className="text-base leading-[1.9] text-ink-muted">
        رسالة تصل إلى صندوق الإشعارات داخل حساب الطالب. الإشعارات التلقائية
        (تفعيل كود، فتح مقرر) تُرسل وحدها ولا تحتاج هذا النموذج.
      </p>

      {generalError && (
        <p role="alert" className="flex items-center gap-1.5 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {generalError}
        </p>
      )}

      <Field label="العنوان" error={fieldErrors?.title} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <Field label="النص" error={fieldErrors?.body} hint="اختياري — سطر أو سطران يوضّحان الخبر">
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            name="body"
            rows={2}
            maxLength={500}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink"
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="من يستقبله" error={fieldErrors?.audience} required>
          {({ id }) => (
            <Select
              id={id}
              name="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as 'all' | 'grade' | 'course')}
              required
            >
              <option value="all">كل الطلاب النشطين</option>
              <option value="grade">صفّ دراسي بعينه</option>
              <option value="course">مشتركو مقرر بعينه</option>
            </Select>
          )}
        </Field>

        {audience === 'grade' && (
          <Field label="الصف" error={fieldErrors?.gradeId} required>
            {({ id }) => (
              <Select
                id={id}
                name="gradeId"
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                required
              >
                <option value="">اختر الصف</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {audience === 'course' && (
          <Field label="المقرر" error={fieldErrors?.courseId} required>
            {({ id }) => (
              <Select
                id={id}
                name="courseId"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
              >
                <option value="">اختر المقرر</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
      </div>

      <Field
        label="رابط"
        error={fieldErrors?.link}
        hint="اختياري — مسار داخل المنصة مثل ‎/student/courses"
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="link"
            dir="ltr"
            className="text-start"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  )
}
