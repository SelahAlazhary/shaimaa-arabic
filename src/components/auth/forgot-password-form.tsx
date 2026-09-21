'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { requestPasswordReset, type ActionState } from '@/lib/mutations/auth'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: ActionState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" block loading={pending} loadingText="جارٍ الإرسال…">
      إرسال الرابط
    </Button>
  )
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initial)
  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {generalError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius-card)] bg-danger-bg p-3.5 text-base text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{generalError}</span>
        </div>
      )}

      <Field label="البريد الإلكتروني" error={fieldErrors?.email} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
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
