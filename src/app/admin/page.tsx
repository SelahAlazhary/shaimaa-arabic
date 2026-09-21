import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Users,
  UserCheck,
  UserX,
  BookOpen,
  Ticket,
  TicketCheck,
  LifeBuoy,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { canOpenPage, type AdminPageKey } from '@/lib/permissions/pages'
import { getAdminOverview } from '@/lib/queries/admin'
import { Card, CardHeader, EmptyState, StatCard, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber, formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'نظرة عامة' }

export default async function AdminOverviewPage() {
  const me = await requireAdmin()
  const o = await getAdminOverview()

  const firstName = me.fullName.trim().split(/\s+/)[0] ?? me.fullName

  return (
    <div className="space-y-6">
      <PageHeader
        title="نظرة عامة"
        description={`أهلًا ${firstName} — ملخّص حالة المنصة والطلاب.`}
      />

      {/* الأرقام مرتّبة بالأهمية: الطلاب أولًا ثم المحتوى ثم الأكواد */}
      <section aria-label="إحصائيات المنصة" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="إجمالي الطلاب" value={formatNumber(o.totalStudents)} tone="info" />
        <StatCard icon={UserCheck} label="طلاب نشطون" value={formatNumber(o.activeStudents)} tone="success" />
        <StatCard icon={UserX} label="حسابات موقوفة" value={formatNumber(o.suspendedStudents)} tone="warning" />
        <StatCard icon={BookOpen} label="مقررات منشورة" value={formatNumber(o.publishedCourses)} tone="neutral" />
        <StatCard icon={GraduationCap} label="اشتراكات نشطة" value={formatNumber(o.activeEnrollments)} tone="success" />
        <StatCard icon={Ticket} label="أكواد متاحة" value={formatNumber(o.availableCodes)} tone="info" />
        <StatCard icon={TicketCheck} label="أكواد مستخدمة" value={formatNumber(o.usedCodes)} tone="neutral" />
        <StatCard icon={LifeBuoy} label="محادثات مفتوحة" value={formatNumber(o.openTickets)} tone="warning" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader
            title="أحدث الطلاب"
            icon={Users}
            action={
              o.recentStudents.length > 0 ? (
                <Link
                  href="/admin/students"
                  className="flex items-center gap-1 text-base text-brand-600 underline-offset-4 hover:underline"
                >
                  عرض الكل
                  <ArrowLeft className="size-3.5" aria-hidden />
                </Link>
              ) : undefined
            }
          />

          {o.recentStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا يوجد طلاب بعد"
              description="يظهر هنا آخر الطلاب المسجَّلين بمجرد إنشاء أول حساب."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {o.recentStudents.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate text-base font-medium text-ink">{s.fullName}</span>
                    <span className="block truncate text-sm text-ink-faint" dir="ltr">
                      {s.email}
                    </span>
                    {s.gradeName && (
                      <span className="mt-0.5 block text-sm text-ink-muted">{s.gradeName}</span>
                    )}
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={s.status === 'active' ? 'success' : 'warning'}>
                      {s.status === 'active' ? 'نشط' : 'موقوف'}
                    </Badge>
                    <span className="nums-ar text-sm text-ink-faint">{formatDate(s.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="إجراءات سريعة" />
          <ul className="divide-y divide-border-subtle">
            {[
              { page: 'students', href: '/admin/students', label: 'إدارة الطلاب', icon: Users, hint: `${formatNumber(o.totalStudents)} طالب` },
              { page: 'courses', href: '/admin/courses', label: 'المقررات', icon: BookOpen, hint: `${formatNumber(o.totalCourses)} مقرر` },
              { page: 'codes', href: '/admin/codes', label: 'أكواد التفعيل', icon: Ticket, hint: `${formatNumber(o.availableCodes)} متاح` },
              { page: 'support', href: '/admin/support', label: 'الدعم', icon: LifeBuoy, hint: `${formatNumber(o.openTickets)} مفتوحة` },
              // الاختصار لا يُعرض لمن لا يفتح صفحته: رابط يردّه لا معنى له
            ].filter(({ page }) => canOpenPage(me.allowedPages, me.role === 'super_admin', page as AdminPageKey)).map(({ href, label, icon: Icon, hint }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-field)] bg-surface-muted text-ink-muted">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">{label}</span>
                    <span className="nums-ar block text-sm text-ink-faint">{hint}</span>
                  </span>
                  <ArrowLeft className="size-4 shrink-0 text-ink-faint" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
