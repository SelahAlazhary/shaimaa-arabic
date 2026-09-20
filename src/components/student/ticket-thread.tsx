'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Send, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, type SupportState } from '@/lib/mutations/support'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export type ThreadMessage = {
  id: string
  message: string | null
  senderId: string
  createdAt: string
}

const initial: SupportState = { status: 'idle' }

function SendButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="icon" loading={pending} aria-label="إرسال">
      {!pending && <Send aria-hidden />}
    </Button>
  )
}

export function TicketThread({
  ticketId,
  currentUserId,
  initialMessages,
  closed,
}: {
  ticketId: string
  currentUserId: string
  initialMessages: ThreadMessage[]
  closed: boolean
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [state, formAction] = useActionState(sendMessage, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Realtime على هذه المحادثة وحدها — لا اشتراك عام على الجدول (البند 45)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string
            message: string | null
            sender_id: string
            created_at: string
          }
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    message: row.message,
                    senderId: row.sender_id,
                    createdAt: row.created_at,
                  },
                ],
          )
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [ticketId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    if (state.status === 'idle') formRef.current?.reset()
  }, [state])

  return (
    <div className="flex flex-col">
      <ol className="max-h-[28rem] space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId
          return (
            <li key={m.id} className={cn('flex', mine ? 'justify-start' : 'justify-end')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-[var(--radius-card)] px-3.5 py-2.5',
                  mine ? 'bg-brand-700 text-ink-invert' : 'bg-surface-muted text-ink',
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
                <p
                  className={cn(
                    'nums-ar mt-1 text-[0.6875rem]',
                    mine ? 'text-brand-200' : 'text-ink-faint',
                  )}
                >
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
            </li>
          )
        })}
        <div ref={endRef} />
      </ol>

      <div className="border-t border-border-subtle p-4">
        {closed ? (
          <p className="text-center text-sm text-ink-muted">
            هذه المحادثة مغلقة. افتح محادثة جديدة لو عندك استفسار آخر.
          </p>
        ) : (
          <>
            <form ref={formRef} action={formAction} className="flex items-end gap-2">
              <input type="hidden" name="ticketId" value={ticketId} />
              <label htmlFor="reply" className="sr-only">
                رسالتك
              </label>
              <textarea
                id="reply"
                name="message"
                rows={1}
                maxLength={2000}
                placeholder="اكتب رسالتك…"
                className="min-h-11 flex-1 resize-y rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint hover:border-ink-faint"
              />
              <SendButton />
            </form>

            {state.status === 'error' && (
              <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
                <AlertCircle className="size-4 shrink-0" aria-hidden />
                {state.message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
