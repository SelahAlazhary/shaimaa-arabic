import Link from 'next/link'
import { LifeBuoy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { TICKET_TYPE_LABELS, TICKET_STATUS_LABELS, type TicketType, type TicketStatus } from '@/lib/support/labels'
import { formatDateTime, formatNumber } from '@/lib/utils/format'

const TONE: Record<TicketStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  open: 'success',
  pending: 'warning',
  resolved: 'info',
  closed: 'neutral',
}

/**
 * قائمة التذاكر — مشتركة بين لوحة الإدارة ولوحة الدعم.
 * RLS هي من تحدّد ما يراه كل دور: المدير يرى الكل، والدعم يرى ما يخصّه.
 */
export async function TicketsList({ basePath }: { basePath: string }) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('support_tickets')
    .select('id, type, status, last_message_at, unread_for_staff, profiles!support_tickets_student_id_fkey(full_name, email)')
    .order('last_message_at', { ascending: false })
    .limit(100)

  const tickets = (data ?? []) as unknown as {
    id: string
    type: TicketType
    status: TicketStatus
    last_message_at: string
    unread_for_staff: number
    profiles: { full_name: string; email: string } | null
  }[]

  return (
    <Card>
      <CardHeader
        title="المحادثات"
        icon={LifeBuoy}
        action={
          <span className="nums-ar text-sm text-ink-faint">
            {formatNumber(tickets.length)} محادثة
          </span>
        }
      />

      {tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="لا توجد محادثات"
          description="أول ما يفتح طالب محادثة دعم، هتظهر هنا مع بياناته."
        />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`${basePath}/${t.id}`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-muted"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-base font-medium text-ink">
                      {t.profiles?.full_name ?? 'طالب'}
                    </span>
                    {t.unread_for_staff > 0 && (
                      <span className="nums-ar inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-danger text-[0.625rem] font-semibold text-ink-invert">
                        {formatNumber(t.unread_for_staff)}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink-muted">
                    {TICKET_TYPE_LABELS[t.type]}
                  </span>
                  <span className="nums-ar mt-0.5 block text-sm text-ink-faint">
                    {formatDateTime(t.last_message_at)}
                  </span>
                </span>

                <Badge tone={TONE[t.status]}>{TICKET_STATUS_LABELS[t.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
