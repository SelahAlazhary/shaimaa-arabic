'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { resetPassword, type ActionState } from '@/lib/mutations/auth'
import { Field, PasswordInput } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: ActionState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" block loading={pending} loadingText="جارٍ الحفظ…">
      حفظ كلمة المرور
    </Button>
  )
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPassword, initial)
  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {generalError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius-card)] bg-danger-bg p-3.5 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{generalError}</span>
        </div>
      )}

      <Field
        label="كلمة المرور الجديدة"
        error={fieldErrors?.password}
        hint="٨ أحرف على الأقل."
        required
      >
        {({ id, describedBy, invalid }) => (
          <PasswordInput
            id={id}
            name="password"
            autoComplete="new-password"
            dir="ltr"
            className="text-start"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <Field label="تأكيد كلمة المرور" error={fieldErrors?.confirmPassword} required>
        {({ id, describedBy, invalid }) => (
          <PasswordInput
            id={id}
            name="confirmPassword"
            autoComplete="new-password"
            dir="ltr"
            className="text-start"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  )
}
