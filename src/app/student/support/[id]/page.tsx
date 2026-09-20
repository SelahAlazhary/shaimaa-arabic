import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, Badge } from '@/components/ui/card'
import { TicketThread, type ThreadMessage } from '@/components/student/ticket-thread'
import {
  TICKET_TYPE_LABELS,
  TICKET_STATUS_LABELS,
  type TicketType,
  type TicketStatus,
} from '@/lib/support/labels'

export const metadata: Metadata = { title: 'محادثة الدعم' }

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStudent()
  const { id } = await params
  const supabase = await createClient()

  // RLS تُرجع null لمحادثة لا يملكها — لا حاجة لفحص المالك هنا
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, type, status')
    .eq('id', id)
    .maybeSingle()

  if (!ticket) notFound()

  const { data: rows } = await supabase
    .from('support_messages')
    .select('id, message, sender_id, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const messages: ThreadMessage[] = (rows ?? []).map((m) => ({
    id: m.id,
    message: m.message,
    senderId: m.sender_id,
    createdAt: m.created_at,
  }))

  // تصفير عدّاد غير المقروء للطالب
  await supabase.rpc('mark_support_read', { p_ticket: id })

  const status = ticket.status as TicketStatus

  return (
    <div>
      <Link
        href="/student/support"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        كل المحادثات
      </Link>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <h1 className="text-sm font-semibold text-ink">
            {TICKET_TYPE_LABELS[ticket.type as TicketType]}
          </h1>
          <Badge
            tone={
              status === 'open' ? 'success'
              : status === 'pending' ? 'warning'
              : status === 'resolved' ? 'info'
              : 'neutral'
            }
          >
            {TICKET_STATUS_LABELS[status]}
          </Badge>
        </div>

        <TicketThread
          ticketId={id}
          currentUserId={user.id}
          initialMessages={messages}
          closed={status === 'closed'}
        />
      </Card>
    </div>
  )
}
