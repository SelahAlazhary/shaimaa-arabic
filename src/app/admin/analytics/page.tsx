import type { Metadata } from 'next'
import { BarChart3, Users, Ticket, TrendingUp, BookOpen } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, StatCard, ProgressBar } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber, formatPrice } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'التحليلات' }

export default async function AdminAnalyticsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceIso = since.toISOString()

  const [newStudents, redemptions, enrollRes, coursesRes, lessonsRes, progressRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .gte('created_at', sinceIso),
      supabase
        .from('activation_redemptions')
        .select('id', { count: 'exact', head: true })
        .gte('redeemed_at', sinceIso),
      supabase.from('enrollments').select('course_id').eq('status', 'active'),
      supabase.from('courses').select('id, title, price'),
      supabase.from('lessons').select('id, course_id').eq('is_published', true),
      supabase.from('lesson_progress').select('lesson_id').eq('completed', true),
    ])

  const courses = coursesRes.data ?? []
  const enrollments = enrollRes.data ?? []
  const lessons = lessonsRes.data ?? []
  const completed = new Set((progressRes.data ?? []).map((p) => p.lesson_id))

  const perCourse = courses
    .map((c) => {
      const students = enrollments.filter((e) => e.course_id === c.id).length
      const courseLessons = lessons.filter((l) => l.course_id === c.id)
      const done = courseLessons.filter((l) => completed.has(l.id)).length
      return {
        id: c.id,
        title: c.title,
        students,
        // الإيراد تقديري: عدد الاشتراكات النشطة × سعر الكورس المعلن
        revenue: students * Number(c.price ?? 0),
        percent:
          courseLessons.length === 0 || students === 0
            ? 0
            : Math.round((done / (courseLessons.length * students)) * 100),
      }
    })
    .sort((a, b) => b.students - a.students)

  const totalRevenue = perCourse.reduce((s, c) => s + c.revenue, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="التحليلات" description="أداء المنصة خلال آخر ٣٠ يومًا وتوزيع الطلاب." />

      <section aria-label="أرقام آخر ٣٠ يومًا" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="طلاب جدد" value={formatNumber(newStudents.count ?? 0)} tone="info" />
        <StatCard icon={Ticket} label="أكواد مُفعّلة" value={formatNumber(redemptions.count ?? 0)} tone="success" />
        <StatCard icon={BookOpen} label="اشتراكات نشطة" value={formatNumber(enrollments.length)} tone="neutral" />
        <StatCard icon={TrendingUp} label="إيراد تقديري" value={formatPrice(totalRevenue)} tone="success" />
      </section>

      <Card>
        <CardHeader title="أداء الكورسات" icon={BarChart3} />

        {perCourse.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="لا بيانات كافية"
            description="بعد اشتراك الطلاب في الكورسات ستظهر هنا أرقام المشاهدة والإكمال."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {perCourse.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-medium text-ink">{c.title}</p>
                  <p className="nums-ar text-sm text-ink-muted">
                    {formatNumber(c.students)} طالب · {formatPrice(c.revenue)}
                  </p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={c.percent} label={`متوسط إكمال ${c.title}`} />
                </div>
                <p className="nums-ar mt-1.5 text-sm text-ink-faint">
                  متوسط الإكمال {formatNumber(c.percent)}٪
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-sm leading-relaxed text-ink-faint">
        الإيراد تقديري: عدد الاشتراكات النشطة مضروبًا في السعر المعلن للكورس. لا يشمل
        الخصومات ولا الاشتراكات اليدوية المجانية.
      </p>
    </div>
  )
}
