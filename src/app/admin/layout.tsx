import { AppShell } from '@/components/layout/app-shell'
import { requireAdmin } from '@/lib/permissions'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()

  return (
    <AppShell user={user} area="admin" areaLabel="لوحة الإدارة" pageTitle="إدارة المنصة">
      {children}
    </AppShell>
  )
}
