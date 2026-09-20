import type { Metadata } from 'next'
import Link from 'next/link'
import { LifeBuoy, MessageSquare } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { NewTicketForm } from '@/components/student/new-ticket-form'
import {
  TICKET_TYPE_LABELS,
  TICKET_STATUS_LABELS,
  type TicketType,
  type TicketStatus,
} from '@/lib/support/labels'
import { formatDateTime, formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'المساعدة والدعم' }

export default async function StudentSupportPage() {
  await requireStudent()
  const supabase = await createClient()

  const { data } = await supabase
    .from('support_tickets')
    .select('id, type, status, last_message_at, unread_for_student')
    .order('last_message_at', { ascending: false })

  const tickets = (data ?? []) as {
    id: string
    type: TicketType
    status: TicketStatus
    last_message_at: string
    unread_for_student: number
  }[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="المساعدة والدعم"
        description="تواصل مع فريق الدعم مباشرة عند وجود أي استفسار أو مشكلة."
      />

      <Card>
        <CardHeader title="محادثة جديدة" icon={LifeBuoy} />
        <NewTicketForm />
      </Card>

      <Card>
        <CardHeader title="محادثاتك" icon={MessageSquare} />

        {tickets.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="لا توجد محادثات بعد"
            description="اختر نوع المساعدة بالأعلى واكتب رسالتك لبدء محادثة مع الدعم."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/student/support/${t.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-base font-medium text-ink">
                        {TICKET_TYPE_LABELS[t.type]}
                      </span>
                      {t.unread_for_student > 0 && (
                        <span className="nums-ar inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-danger text-[0.625rem] font-semibold text-ink-invert">
                          {formatNumber(t.unread_for_student)}
                        </span>
                      )}
                    </span>
                    <span className="nums-ar mt-0.5 block text-sm text-ink-faint">
                      آخر تحديث {formatDateTime(t.last_message_at)}
                    </span>
                  </span>

                  <Badge
                    tone={
                      t.status === 'open' ? 'success'
                      : t.status === 'pending' ? 'warning'
                      : t.status === 'resolved' ? 'info'
                      : 'neutral'
                    }
                  >
                    {TICKET_STATUS_LABELS[t.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
