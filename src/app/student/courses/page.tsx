import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Ticket, CalendarClock, Lock, ArrowLeft } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { getStudentHome } from '@/lib/queries/student-home'
import { Card, CardHeader, EmptyState, ProgressBar, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { RedeemCodeForm } from '@/components/student/redeem-code-form'
import { formatNumber, formatDate, formatPrice } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'مقرراتي' }

export default async function StudentCoursesPage() {
  await requireStudent()
  const { courses } = await getStudentHome()

  /*
   * المقررات المتاحة: منشورة ولم يشترك فيها الطالب بعد.
   * تظهر بعناوين دروسها مقفلة — يرى ما سيحصل عليه قبل أن يدفع،
   * ويفتحها الكود في اللحظة نفسها.
   */
  const supabase = await createClient()
  const enrolledIds = new Set(courses.map((c) => c.id))

  const [availableRes, lessonCountRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, slug, description, price, thumbnail_url, grades(name_ar)')
      .eq('status', 'published')
      .order('sort_order'),
    supabase.from('lessons').select('course_id').eq('is_published', true),
  ])

  const lessonsPerCourse = new Map<string, number>()
  for (const l of lessonCountRes.data ?? []) {
    lessonsPerCourse.set(l.course_id, (lessonsPerCourse.get(l.course_id) ?? 0) + 1)
  }

  const available = ((availableRes.data ?? []) as unknown as {
    id: string
    title: string
    slug: string
    description: string | null
    price: number
    thumbnail_url: string | null
    grades: { name_ar: string } | null
  }[]).filter((c) => !enrolledIds.has(c.id))

  return (
    <div>
      <PageHeader
        title="مقرراتي"
        description="المقررات المفتوحة على حسابك. فعّل كود جديد لإضافة مقرر."
      />

      {/* التفعيل أعلى الصفحة: هو الإجراء الأساسي هنا (البند 11) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-field)] bg-accent-bg text-accent">
            <Ticket className="size-[1.125rem]" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">عندك كود تفعيل؟</h2>
            <p className="mt-0.5 text-base text-ink-muted">
              اكتب الكود هنا ويُفتح المقرر في حسابك فورًا.
            </p>
          </div>
        </div>
        <RedeemCodeForm />
      </Card>

      <Card>
        <CardHeader title="المقررات المفتوحة" icon={BookOpen} />

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد مقررات بعد"
            description="فعّل كودك من الأعلى، ويُفتح المقرر هنا مباشرة."
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
                    <p className="text-base font-medium text-ink">{c.title}</p>
                    <Badge tone={c.percent === 100 ? 'success' : 'neutral'}>
                      {formatNumber(c.percent)}٪
                    </Badge>
                  </div>

                  <p className="nums-ar mt-1 text-sm text-ink-faint">
                    {formatNumber(c.completedLessons)} من {formatNumber(c.totalLessons)} درس
                  </p>

                  {c.expiresAt && (
                    <p className="nums-ar mt-1 flex items-center gap-1.5 text-sm text-warning">
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

      {available.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="مقررات متاحة"
            icon={Lock}
            action={
              <span className="nums-ar text-sm text-ink-faint">
                {formatNumber(available.length)} مقرر
              </span>
            }
          />

          <ul className="divide-y divide-border-subtle">
            {available.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/student/courses/${c.slug}`}
                  className="block px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {c.thumbnail_url && (
                      <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-[var(--radius-field)] border border-border-subtle">
                        <Image
                          src={c.thumbnail_url}
                          alt=""
                          fill
                          sizes="8rem"
                          className="object-cover"
                        />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <p className="text-base font-medium text-ink">{c.title}</p>
                      {c.grades?.name_ar && (
                        <p className="mt-0.5 text-sm text-ink-faint">{c.grades.name_ar}</p>
                      )}
                    </span>
                    <Badge tone="neutral">
                      {c.price > 0 ? formatPrice(c.price) : 'مجاني'}
                    </Badge>
                  </div>

                  {c.description && (
                    <p className="mt-1.5 text-base leading-relaxed text-ink-muted">
                      {c.description}
                    </p>
                  )}

                  <p className="nums-ar mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint">
                    <span className="flex items-center gap-1.5">
                      <Lock className="size-3.5" aria-hidden />
                      {formatNumber(lessonsPerCourse.get(c.id) ?? 0)} درس — تُفتح بالكود
                    </span>
                    <span className="flex items-center gap-1.5 text-brand-600">
                      استعرض محتواه
                      <ArrowLeft className="size-3.5" aria-hidden />
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
