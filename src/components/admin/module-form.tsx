'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Plus, AlertCircle } from 'lucide-react'
import { addModule, type FormState } from '@/lib/mutations/content'
import { Button } from '@/components/ui/button'

const initial: FormState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الإضافة…" className="sm:w-auto">
      <Plus aria-hidden />
      إضافة
    </Button>
  )
}

export function ModuleForm({ courseId }: { courseId: string }) {
  const [state, formAction] = useActionState(addModule, initial)
  const [title, setTitle] = useState('')
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message)
      setTitle('')
      setFormKey((k) => k + 1)
    }
    if (state.status === 'error') setFormKey((k) => k + 1)
  }, [state])

  const error =
    state.status === 'error' ? (state.fieldErrors?.title ?? state.message) : undefined

  return (
    <form key={formKey} action={formAction} className="space-y-2 p-5" noValidate>
      <input type="hidden" name="courseId" value={courseId} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="module-title" className="sr-only">
            عنوان الوحدة
          </label>
          <input
            id="module-title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: الوحدة الأولى — المرفوعات"
            aria-invalid={Boolean(error) || undefined}
            className={[
              'h-11 w-full rounded-[var(--radius-field)] border bg-surface px-3.5 text-sm text-ink',
              'placeholder:text-ink-faint',
              error ? 'border-danger' : 'border-border-strong hover:border-ink-faint',
            ].join(' ')}
          />
        </div>
        <SubmitButton />
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </form>
  )
}
