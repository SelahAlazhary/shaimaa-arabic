import type { Metadata } from 'next'
import Link from 'next/link'
import { Ticket, Download } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, StatCard, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { GenerateCodesForm } from '@/components/admin/generate-codes-form'
import { formatNumber, formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'أكواد التفعيل' }

const STATUS = {
  active: { label: 'متاح', tone: 'success' as const },
  used: { label: 'مستخدم', tone: 'neutral' as const },
  expired: { label: 'منتهٍ', tone: 'warning' as const },
  cancelled: { label: 'ملغى', tone: 'danger' as const },
}

export default async function AdminCodesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [coursesRes, codesRes, availableRes, usedRes, totalRes] = await Promise.all([
    supabase.from('courses').select('id, title').order('title'),
    supabase
      .from('activation_codes')
      .select('id, code, status, batch, grants_days, created_at, courses(title)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('activation_codes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('activation_codes').select('id', { count: 'exact', head: true }).eq('status', 'used'),
    supabase.from('activation_codes').select('id', { count: 'exact', head: true }),
  ])

  const codes = (codesRes.data ?? []) as unknown as {
    id: string; code: string; status: keyof typeof STATUS
    batch: string | null; grants_days: number | null; created_at: string
    courses: { title: string } | null
  }[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="أكواد التفعيل"
        description="ولّد أكوادًا لكل كورس، بِعها للطلاب، وتابع المستخدَم منها."
        action={
          <Link
            href="/admin/codes/export"
            prefetch={false}
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] border border-border-strong bg-surface px-4 text-base font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            <Download className="size-4" aria-hidden />
            تصدير CSV
          </Link>
        }
      />

      <section aria-label="ملخّص الأكواد" className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Ticket} label="إجمالي الأكواد" value={formatNumber(totalRes.count ?? 0)} tone="neutral" />
        <StatCard icon={Ticket} label="متاح للبيع" value={formatNumber(availableRes.count ?? 0)} tone="success" />
        <StatCard icon={Ticket} label="مستخدم" value={formatNumber(usedRes.count ?? 0)} tone="info" />
      </section>

      <Card>
        <CardHeader title="توليد أكواد" icon={Ticket} />
        <GenerateCodesForm courses={coursesRes.data ?? []} />
      </Card>

      <Card>
        <CardHeader title="آخر الأكواد" icon={Ticket} />

        {codes.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="لا توجد أكواد بعد"
            description="ولّد أول دفعة أكواد من الأعلى، ثم وزّعها على الطلاب."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {codes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <span className="min-w-0">
                  <span className="block font-mono text-base tracking-wider text-ink" dir="ltr">
                    {c.code}
                  </span>
                  <span className="nums-ar mt-0.5 block text-sm text-ink-faint">
                    {[
                      c.courses?.title,
                      c.grants_days ? `${formatNumber(c.grants_days)} يوم` : null,
                      c.batch,
                      formatDate(c.created_at),
                    ].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
