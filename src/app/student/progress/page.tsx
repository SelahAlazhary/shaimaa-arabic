import type { Metadata } from 'next'
import { TrendingUp, CheckCircle2, BookOpen, Target } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, StatCard, ProgressBar } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'تقدّمي' }

type ProgressPayload = {
  courses: {
    course_id: string
    title: string
    slug: string
    total_lessons: number
    completed_lessons: number
    percent: number
  }[]
  totals: {
    courses: number
    completed_lessons: number
    total_lessons: number
    average_percent: number
  }
}

export default async function StudentProgressPage() {
  await requireStudent()
  const supabase = await createClient()

  // الحساب في القاعدة لا في الواجهة: نسبة واحدة معتمدة لا نسختان متضاربتان (البند 17)
  const { data } = await supabase.rpc('get_student_progress')
  const payload = (data as unknown as ProgressPayload | null) ?? {
    courses: [],
    totals: { courses: 0, completed_lessons: 0, total_lessons: 0, average_percent: 0 },
  }

  const { courses, totals } = payload

  return (
    <div>
      <PageHeader title="تقدّمي" description="ملخّص إنجازك في كل مقرر مفتوح على حسابك." />

      <section aria-label="ملخّص التقدّم" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="مقرراتي" value={formatNumber(totals.courses)} tone="info" />
        <StatCard
          icon={CheckCircle2}
          label="دروس مكتملة"
          value={formatNumber(totals.completed_lessons)}
          tone="success"
        />
        <StatCard
          icon={Target}
          label="إجمالي الدروس"
          value={formatNumber(totals.total_lessons)}
          tone="neutral"
        />
        <StatCard
          icon={TrendingUp}
          label="متوسط الإكمال"
          value={`${formatNumber(Math.round(totals.average_percent))}٪`}
          tone="success"
        />
      </section>

      <Card>
        <CardHeader title="تقدّمك في المقررات" icon={TrendingUp} />

        {courses.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="لا يوجد تقدّم بعد"
            description="ابدأ أول درس، وستجد نسبة إنجازك في كل مقرر هنا."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {courses.map((c) => (
              <li key={c.course_id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-medium text-ink">{c.title}</p>
                  <p className="nums-ar text-base text-ink-muted">
                    {formatNumber(Math.round(c.percent))}٪
                  </p>
                </div>
                <p className="nums-ar mt-1 text-sm text-ink-faint">
                  {formatNumber(c.completed_lessons)} من {formatNumber(c.total_lessons)} درس
                </p>
                <div className="mt-3">
                  <ProgressBar value={c.percent} label={`تقدّمك في ${c.title}`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
