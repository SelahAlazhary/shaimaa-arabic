'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { AlertCircle, Save } from 'lucide-react'
import { saveCourse, type FormState } from '@/lib/mutations/content'
import { COURSE_STATUSES } from '@/lib/validations/content'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: FormState = { status: 'idle' }

export type CourseDefaults = {
  id?: string
  title: string
  description: string
  gradeId: string
  price: string
  status: string
  slug: string
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الحفظ…">
      <Save aria-hidden />
      {editing ? 'حفظ التعديلات' : 'إنشاء الكورس'}
    </Button>
  )
}

export function CourseForm({
  grades,
  defaults,
}: {
  grades: { id: string; name_ar: string }[]
  defaults?: CourseDefaults
}) {
  const [state, formAction] = useActionState(saveCourse, initial)
  const editing = Boolean(defaults?.id)

  // نفس علّة نموذج التسجيل: React يُصفّر النموذج بعد الإجراء،
  // فالقيم في الحالة والمفتاح يُعيد التركيب مُزامَنًا (البند 15)
  const [values, setValues] = useState({
    title: defaults?.title ?? '',
    description: defaults?.description ?? '',
    gradeId: defaults?.gradeId ?? '',
    price: defaults?.price ?? '',
    status: defaults?.status ?? 'draft',
    slug: defaults?.slug ?? '',
  })

  const [formKey, setFormKey] = useState(0)
  useEffect(() => {
    if (state.status === 'error') setFormKey((k) => k + 1)
    if (state.status === 'success') toast.success(state.message)
  }, [state])

  const set = (k: keyof typeof values, v: string) => setValues((p) => ({ ...p, [k]: v }))

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form key={formKey} action={formAction} className="space-y-4 p-5" noValidate>
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      {generalError && (
        <p role="alert" className="flex items-center gap-1.5 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {generalError}
        </p>
      )}

      <Field label="عنوان الكورس" error={fieldErrors?.title} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="title"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="مثال: النحو — الفصل الدراسي الأول"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <Field label="وصف الكورس" error={fieldErrors?.description}>
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            name="description"
            rows={3}
            maxLength={2000}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            placeholder="نبذة يراها الطالب قبل الاشتراك."
            className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-faint hover:border-ink-faint"
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الصف الدراسي" error={fieldErrors?.gradeId} hint="اتركه فارغًا ليظهر لكل الصفوف">
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              name="gradeId"
              value={values.gradeId}
              onChange={(e) => set('gradeId', e.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
            >
              <option value="">كل الصفوف</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="السعر بالجنيه" error={fieldErrors?.price} hint="صفر أو فارغ يعني كورسًا مجانيًا">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="price"
              value={values.price}
              onChange={(e) => set('price', e.target.value.replace(/[^\d.]/g, ''))}
              inputMode="decimal"
              dir="ltr"
              className="text-start"
              placeholder="150"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="حالة النشر" error={fieldErrors?.status} required>
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
              {COURSE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.hint}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="معرّف الرابط"
          error={fieldErrors?.slug}
          hint="اتركه فارغًا ليُولَّد تلقائيًا · حروف إنجليزية وأرقام وشرطات"
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="slug"
              value={values.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              dir="ltr"
              className="text-start font-mono"
              placeholder="nahw-term-1"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>
      </div>

      <SubmitButton editing={editing} />
    </form>
  )
}
