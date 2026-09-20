import type { Metadata } from 'next'
import { requireSupport } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/page-header'
import { TicketsList } from '@/components/admin/tickets-list'

export const metadata: Metadata = { title: 'المحادثات' }

export default async function SupportHomePage() {
  await requireSupport()

  return (
    <div>
      <PageHeader
        title="تذاكر الدعم"
        description="المحادثات المسندة إليك. ردّ على الطالب وحدّث حالة المحادثة."
      />
      <TicketsList basePath="/support" />
    </div>
  )
}
