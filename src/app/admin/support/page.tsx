import type { Metadata } from 'next'
import { requireAdminPage } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/page-header'
import { TicketsList } from '@/components/admin/tickets-list'

export const metadata: Metadata = { title: 'الدعم' }

export default async function AdminSupportPage() {
  await requireAdminPage('support')

  return (
    <div>
      <PageHeader
        title="الدعم والمحادثات"
        description="ردّ على أسئلة الطلاب، وتابع حالة كل محادثة حتى إغلاقها."
      />
      <TicketsList basePath="/admin/support" />
    </div>
  )
}
