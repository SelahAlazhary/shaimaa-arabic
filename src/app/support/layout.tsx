import { AppShell } from '@/components/layout/app-shell'
import { requireSupport } from '@/lib/permissions'

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSupport()

  return (
    <AppShell user={user} area="support" areaLabel="لوحة الدعم" pageTitle="التذاكر">
      {children}
    </AppShell>
  )
}
