'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { AlertCircle, Plus, Save } from 'lucide-react'
import { saveLesson, type FormState } from '@/lib/mutations/content'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: FormState = { status: 'idle' }

export type LessonDefaults = {
  id: string
  title: string
  description: string
  videoUrl: string
  durationMinutes: string
  moduleId: string
  isFree: boolean
  isPublished: boolean
}

const BLANK = {
  title: '',
  description: '',
  videoUrl: '',
  durationMinutes: '',
  moduleId: '',
  isFree: false,
  isPublished: true,
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الحفظ…">
      {editing ? <Save aria-hidden /> : <Plus aria-hidden />}
      {editing ? 'حفظ التعديل' : 'إضافة الدرس'}
    </Button>
  )
}

export function LessonForm({
  courseId,
  modules,
  lesson,
  onDone,
}: {
  courseId: string
  modules: { id: string; title: string }[]
  /** موجود ⇐ وضع التعديل */
  lesson?: LessonDefaults
  onDone?: () => void
}) {
  const editing = Boolean(lesson)
  const [state, formAction] = useActionState(saveLesson, initial)

  const [values, setValues] = useState(() =>
    lesson
      ? {
          title: lesson.title,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          durationMinutes: lesson.durationMinutes,
          moduleId: lesson.moduleId,
          isFree: lesson.isFree,
          isPublished: lesson.isPublished,
        }
      : BLANK,
  )

  const [formKey, setFormKey] = useState(0)
  useEffect(() => {
    if (state.status === 'error') setFormKey((k) => k + 1)
    if (state.status === 'success') {
      toast.success(state.message)
      if (editing) {
        onDone?.()
      } else {
        // النجاح يُفرّغ النموذج عمدًا: المدير يضيف دروسًا متتابعة
        setValues(BLANK)
        setFormKey((k) => k + 1)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) =>
    setValues((p) => ({ ...p, [k]: v }))

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form key={formKey} action={formAction} className="space-y-4 p-5" noValidate>
      <input type="hidden" name="courseId" value={courseId} />
      {editing && <input type="hidden" name="id" value={lesson!.id} />}

      {generalError && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {generalError}
        </p>
      )}

      <Field label="عنوان الدرس" error={fieldErrors?.title} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="title"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="مثال: المبتدأ والخبر"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <Field
        label="رابط الفيديو"
        error={fieldErrors?.videoUrl}
        hint="يوتيوب أو فيميو أو رابط mp4 مباشر · اتركه فارغًا لدرس بلا فيديو"
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="videoUrl"
            type="url"
            value={values.videoUrl}
            onChange={(e) => set('videoUrl', e.target.value)}
            dir="ltr"
            className="text-start"
            placeholder="https://www.youtube.com/watch?v=..."
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="المدة بالدقائق" error={fieldErrors?.durationMinutes}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="durationMinutes"
              value={values.durationMinutes}
              onChange={(e) => set('durationMinutes', e.target.value.replace(/\D/g, '').slice(0, 3))}
              inputMode="numeric"
              dir="ltr"
              className="text-start"
              placeholder="40"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Field label="الوحدة" error={fieldErrors?.moduleId} hint={modules.length === 0 ? 'لا وحدات بعد' : undefined}>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              name="moduleId"
              value={values.moduleId}
              onChange={(e) => set('moduleId', e.target.value)}
              disabled={modules.length === 0}
              aria-describedby={describedBy}
              invalid={invalid}
            >
              <option value="">بلا وحدة</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label="شرح الدرس" error={fieldErrors?.description}>
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
            placeholder="ما يتعلّمه الطالب في هذا الدرس."
            className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint hover:border-ink-faint"
          />
        )}
      </Field>

      <fieldset className="space-y-2.5">
        <legend className="sr-only">إعدادات النشر</legend>

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="isFree"
            checked={values.isFree}
            onChange={(e) => set('isFree', e.target.checked)}
            className="mt-0.5 size-4 rounded border-border-strong"
          />
          <span>
            <span className="block text-sm font-medium text-ink">درس مجاني</span>
            <span className="block text-xs text-ink-muted">
              يشاهده أي طالب حتى بلا اشتراك — مفيد كعيّنة تشجّع على الشراء.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="isPublished"
            checked={values.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
            className="mt-0.5 size-4 rounded border-border-strong"
          />
          <span>
            <span className="block text-sm font-medium text-ink">منشور</span>
            <span className="block text-xs text-ink-muted">
              أزل العلامة لإخفاء الدرس عن الطلاب حتى تنتهي من تجهيزه.
            </span>
          </span>
        </label>
      </fieldset>

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
