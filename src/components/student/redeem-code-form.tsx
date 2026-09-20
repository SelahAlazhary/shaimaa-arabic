'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Ticket, AlertCircle } from 'lucide-react'
import { redeemCode, type RedeemState } from '@/lib/mutations/enrollment'
import { Button } from '@/components/ui/button'

const initial: RedeemState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ التفعيل…" className="sm:w-auto">
      <Ticket aria-hidden />
      تفعيل
    </Button>
  )
}

export function RedeemCodeForm() {
  const [state, formAction] = useActionState(redeemCode, initial)
  const formRef = useRef<HTMLFormElement>(null)

  // النجاح يُعلَن بـtoast ويُفرَّغ الحقل؛ الخطأ يبقى ظاهرًا تحت الحقل ليُقرأ بهدوء
  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message)
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="redeem-code" className="sr-only">
            كود التفعيل
          </label>
          <input
            id="redeem-code"
            name="code"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            placeholder="SHIMA-XXXX-XXXX"
            aria-invalid={state.status === 'error' || undefined}
            aria-describedby={state.status === 'error' ? 'redeem-error' : undefined}
            className={[
              'h-11 w-full rounded-[var(--radius-field)] border bg-surface px-3.5 text-start text-sm',
              'uppercase tracking-wider placeholder:tracking-normal placeholder:text-ink-faint',
              state.status === 'error' ? 'border-danger' : 'border-border-strong hover:border-ink-faint',
            ].join(' ')}
          />
        </div>
        <SubmitButton />
      </div>

      {state.status === 'error' && (
        <p id="redeem-error" role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}
    </form>
  )
}
