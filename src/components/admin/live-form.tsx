'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { AlertCircle, CalendarPlus } from 'lucide-react'
import { saveLiveStream, type FormState } from '@/lib/mutations/content'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: FormState = { status: 'idle' }

const STATUSES = [
  { value: 'scheduled', label: 'مجدولة' },
  { value: 'live', label: 'مباشر الآن' },
  { value: 'ended', label: 'انتهت' },
  { value: 'cancelled', label: 'ملغاة' },
] as const

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الحفظ…">
      <CalendarPlus aria-hidden />
      جدولة الحصة
    </Button>
  )
}

const EMPTY = {
  title: '',
  courseId: '',
  startsAt: '',
  streamUrl: '',
  recordingUrl: '',
  status: 'scheduled',
  description: '',
}

export function LiveForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, formAction] = useActionState(saveLiveStream, initial)
  const [values, setValues] = useState(EMPTY)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message)
      setValues(EMPTY)
      setFormKey((k) => k + 1)
    }
    if (state.status === 'error') setFormKey((k) => k + 1)
  }, [state])

  const set = (k: keyof typeof values, v: string) => setValues((p) => ({ ...p, [k]: v }))

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form key={formKey} action={formAction} className="space-y-4 p-5" noValidate>
      {generalError && (
        <p role="alert" className="flex items-center gap-1.5 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {generalError}
        </p>
      )}

      <Field label="عنوان الحصة" error={fieldErrors?.title} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="title"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="مثال: مراجعة ليلة الامتحان — النحو"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="الكورس"
          error={fieldErrors?.courseId}
          hint="اتركه فارغًا لتظهر لكل الطلاب"
        >
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

        <Field label="موعد الحصة" error={fieldErrors?.startsAt} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="startsAt"
              type="datetime-local"
              value={values.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
              dir="ltr"
              className="text-start"
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
          )}
        </Field>
      </div>

      <Field
        label="رابط البث"
        error={fieldErrors?.streamUrl}
        hint="Zoom أو Google Meet أو يوتيوب مباشر"
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="streamUrl"
            type="url"
            value={values.streamUrl}
            onChange={(e) => set('streamUrl', e.target.value)}
            dir="ltr"
            className="text-start"
            placeholder="https://zoom.us/j/..."
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="رابط التسجيل"
          error={fieldErrors?.recordingUrl}
          hint="يُضاف بعد انتهاء الحصة"
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="recordingUrl"
              type="url"
              value={values.recordingUrl}
              onChange={(e) => set('recordingUrl', e.target.value)}
              dir="ltr"
              className="text-start"
              placeholder="https://..."
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Field label="الحالة" error={fieldErrors?.status} required>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              name="status"
              value={values.status}
              onChange={(e) => set('status', e.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <SubmitButton />
    </form>
  )
}
