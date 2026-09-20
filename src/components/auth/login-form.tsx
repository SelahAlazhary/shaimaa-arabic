'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { login, type ActionState } from '@/lib/mutations/auth'
import { Field, Input, PasswordInput } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: ActionState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" block loading={pending} loadingText="جارٍ الدخول…">
      دخول
    </Button>
  )
}

export function LoginForm({ next }: { next?: string | undefined }) {
  const [state, formAction] = useActionState(login, initial)
  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

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
            placeholder="name@example.com"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <Field label="كلمة المرور" error={fieldErrors?.password} required>
        {({ id, describedBy, invalid }) => (
          <PasswordInput
            id={id}
            name="password"
            autoComplete="current-password"
            dir="ltr"
            className="text-start"
            placeholder="••••••••"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-base text-brand-600 underline-offset-4 hover:underline"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>

      <SubmitButton />
    </form>
  )
}
