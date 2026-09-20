import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import { deleteCourse as deleteCourseAction } from '@/lib/mutations/content'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber, formatPrice, formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'الكورسات' }

const STATUS = {
  draft: { label: 'مسودّة', tone: 'neutral' as const },
  published: { label: 'منشور', tone: 'success' as const },
  archived: { label: 'مؤرشف', tone: 'warning' as const },
}

export default async function AdminCoursesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [coursesRes, lessonsRes, enrollRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, slug, price, status, updated_at, grades(name_ar)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase.from('lessons').select('course_id'),
    supabase.from('enrollments').select('course_id').eq('status', 'active'),
  ])

  const courses = (coursesRes.data ?? []) as unknown as {
    id: string; title: string; slug: string; price: number
    status: keyof typeof STATUS; updated_at: string; grades: { name_ar: string } | null
  }[]

  const lessonCount = new Map<string, number>()
  for (const l of lessonsRes.data ?? []) {
    lessonCount.set(l.course_id, (lessonCount.get(l.course_id) ?? 0) + 1)
  }
  const studentCount = new Map<string, number>()
  for (const e of enrollRes.data ?? []) {
    studentCount.set(e.course_id, (studentCount.get(e.course_id) ?? 0) + 1)
  }

  return (
    <div>
      <PageHeader
        title="الكورسات"
        description="كل الكورسات وحالة نشرها وعدد دروسها وطلابها."
        action={
          <Link
            href="/admin/courses/new"
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] bg-brand-700 px-4 text-sm font-medium text-ink-invert transition-colors hover:bg-brand-800"
          >
            <Plus className="size-4" aria-hidden />
            كورس جديد
          </Link>
        }
      />

      <Card>
        <CardHeader title="قائمة الكورسات" icon={BookOpen} />

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد كورسات بعد"
            description="أنشئ أول كورس لتبدأ في إضافة الوحدات والدروس ونشرها للطلاب."
            action={
              <Link
                href="/admin/courses/new"
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] bg-brand-700 px-4 text-sm font-medium text-ink-invert transition-colors hover:bg-brand-800"
              >
                <Plus className="size-4" aria-hidden />
                كورس جديد
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {courses.map((c) => (
              <li key={c.id} className="flex items-stretch">
                <Link
                  href={`/admin/courses/${c.id}`}
                  className="min-w-0 flex-1 px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{c.title}</p>
                    {c.grades?.name_ar && (
                      <p className="mt-0.5 text-xs text-ink-muted">{c.grades.name_ar}</p>
                    )}
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                    <Pencil className="size-3.5 text-ink-faint" aria-hidden />
                  </span>
                </div>

                <p className="nums-ar mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
                  <span>{formatNumber(lessonCount.get(c.id) ?? 0)} درس</span>
                  <span>{formatNumber(studentCount.get(c.id) ?? 0)} طالب</span>
                  <span>{c.price > 0 ? formatPrice(c.price) : 'مجاني'}</span>
                  <span>آخر تحديث {formatDate(c.updated_at)}</span>
                </p>
                </Link>

                {/* خارج الرابط: زرّ داخل رابط تركيبٌ غير صالح ويسرق النقرة */}
                <span className="flex shrink-0 items-center pe-2 ps-3">
                  <ConfirmButton
                    label=""
                    srLabel={`حذف ${c.title}`}
                    icon={<Trash2 aria-hidden />}
                    title="حذف الكورس؟"
                    body={`سيُحذف «${c.title}» بكل دروسه ووحداته واختباراته. الحذف ممنوع إن كان فيه طلاب أو أكواد.`}
                    confirmLabel="احذف الكورس"
                    action={deleteCourseAction.bind(null, c.id)}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
