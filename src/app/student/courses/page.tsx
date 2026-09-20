import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Ticket, CalendarClock } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { getStudentHome } from '@/lib/queries/student-home'
import { Card, CardHeader, EmptyState, ProgressBar, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { RedeemCodeForm } from '@/components/student/redeem-code-form'
import { formatNumber, formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'كورساتي' }

export default async function StudentCoursesPage() {
  await requireStudent()
  const { courses } = await getStudentHome()

  return (
    <div>
      <PageHeader
        title="كورساتي"
        description="الكورسات المفتوحة على حسابك. فعّل كود جديد لإضافة كورس."
      />

      {/* التفعيل أعلى الصفحة: هو الإجراء الأساسي هنا (البند 11) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-field)] bg-accent-bg text-accent">
            <Ticket className="size-[1.125rem]" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">عندك كود تفعيل؟</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              اكتب الكود هنا وهيتفتح الكورس على حسابك فورًا.
            </p>
          </div>
        </div>
        <RedeemCodeForm />
      </Card>

      <Card>
        <CardHeader title="الكورسات المفتوحة" icon={BookOpen} />

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد كورسات بعد"
            description="فعّل كود الاشتراك من الأعلى وهيظهر الكورس هنا مباشرة."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/student/courses/${c.slug}`}
                  className="block px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{c.title}</p>
                    <Badge tone={c.percent === 100 ? 'success' : 'neutral'}>
                      {formatNumber(c.percent)}٪
                    </Badge>
                  </div>

                  <p className="nums-ar mt-1 text-xs text-ink-faint">
                    {formatNumber(c.completedLessons)} من {formatNumber(c.totalLessons)} درس
                  </p>

                  {c.expiresAt && (
                    <p className="nums-ar mt-1 flex items-center gap-1.5 text-xs text-warning">
                      <CalendarClock className="size-3.5" aria-hidden />
                      الاشتراك ينتهي في {formatDate(c.expiresAt)}
                    </p>
                  )}

                  <div className="mt-3">
                    <ProgressBar value={c.percent} label={`تقدّمك في ${c.title}`} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
