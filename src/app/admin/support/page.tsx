import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/page-header'
import { TicketsList } from '@/components/admin/tickets-list'

export const metadata: Metadata = { title: 'الدعم' }

export default async function AdminSupportPage() {
  await requireAdmin()

  return (
    <div>
      <PageHeader
        title="الدعم والمحادثات"
        description="محادثات الطلاب مع الدعم — ردّ، صنّف، وأغلق التذاكر."
      />
      <TicketsList basePath="/admin/support" />
    </div>
  )
}
