'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { BookOpen, CreditCard, Wrench, MessageCircle, AlertCircle, Send } from 'lucide-react'
import { openTicket, type SupportState } from '@/lib/mutations/support'
import { TICKET_TYPE_LABELS, type TicketType } from '@/lib/support/labels'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

const initial: SupportState = { status: 'idle' }

const OPTIONS: { value: TicketType; icon: typeof BookOpen; hint: string }[] = [
  { value: 'curriculum_question', icon: BookOpen, hint: 'استفسار عن درس أو قاعدة نحوية' },
  { value: 'subscription_problem', icon: CreditCard, hint: 'الكود، التفعيل، أو مدة الاشتراك' },
  { value: 'technical_problem', icon: Wrench, hint: 'الفيديو لا يعمل أو صفحة لا تفتح' },
  { value: 'other', icon: MessageCircle, hint: 'أي موضوع آخر' },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الإرسال…">
      <Send aria-hidden />
      ابدأ المحادثة
    </Button>
  )
}

export function NewTicketForm() {
  const [state, formAction] = useActionState(openTicket, initial)
  const [type, setType] = useState<TicketType | ''>('')

  return (
    <form action={formAction} className="space-y-5 p-5">
      <fieldset>
        <legend className="mb-3 text-base font-medium text-ink">ما نوع المساعدة التي تحتاجها؟</legend>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {OPTIONS.map(({ value, icon: Icon, hint }) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border p-3.5 transition-colors',
                type === value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border-subtle hover:border-border-strong hover:bg-surface-muted',
              )}
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              <span
                className={cn(
                  'mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--radius-field)]',
                  type === value ? 'bg-brand-700 text-ink-invert' : 'bg-surface-muted text-ink-muted',
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-medium text-ink">
                  {TICKET_TYPE_LABELS[value]}
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed text-ink-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="ticket-message" className="mb-1.5 block text-base font-medium text-ink">
          رسالتك
        </label>
        <textarea
          id="ticket-message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="اشرح سؤالك أو مشكلتك بالتفصيل، ليصلك ردّ دقيق وسريع."
          className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-faint hover:border-ink-faint"
        />
      </div>

      {state.status === 'error' && (
        <p role="alert" className="flex items-center gap-1.5 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
