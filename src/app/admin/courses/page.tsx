import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, ChevronLeft, ChevronRight, LayoutList, Plus, Trash2, Users } from 'lucide-react'
import { deleteCourse as deleteCourseAction } from '@/lib/mutations/content'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { requireAdminPage } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { CourseCover } from '@/components/admin/course-cover'
import { CoursesFilters } from '@/components/admin/courses-filters'
import { formatNumber, formatPrice, formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'الكورسات' }

const PAGE_SIZE = 9

const STATUS = {
  draft: { label: 'مسودّة', tone: 'neutral' as const },
  published: { label: 'منشور', tone: 'success' as const },
  archived: { label: 'مؤرشف', tone: 'warning' as const },
}
type Status = keyof typeof STATUS

const NEW_COURSE_LINK =
  'inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] bg-brand-700 px-4 text-base font-medium text-ink-invert transition-colors hover:bg-brand-800'

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  await requireAdminPage('courses')
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? '1') || 1)
  const status = sp.status && sp.status in STATUS ? (sp.status as Status) : null
  // نزيل المحارف الخاصة ببنية الفلتر في PostgREST حتى لا يكسر المصطلح الاستعلام
  const term = (sp.q ?? '').replace(/[,()*\\%]/g, ' ').trim()
  const filtered = Boolean(term || status)

  const supabase = await createClient()

  let query = supabase
    .from('courses')
    .select('id, title, thumbnail_url, price, status, updated_at, grades(name_ar)', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (term) query = query.ilike('title', `%${term}%`)

  const from = (page - 1) * PAGE_SIZE
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1)

  const courses = (data ?? []) as unknown as {
    id: string
    title: string
    thumbnail_url: string | null
    price: number
    status: Status
    updated_at: string
    grades: { name_ar: string } | null
  }[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // العدّادات للكورسات الظاهرة في هذه الصفحة وحدها، لا للجدول كلّه
  const ids = courses.map((c) => c.id)
  const lessonCount = new Map<string, number>()
  const studentCount = new Map<string, number>()
  if (ids.length > 0) {
    const [lessonsRes, enrollRes] = await Promise.all([
      supabase.from('lessons').select('course_id').in('course_id', ids),
      supabase.from('enrollments').select('course_id').eq('status', 'active').in('course_id', ids),
    ])
    for (const l of lessonsRes.data ?? []) {
      lessonCount.set(l.course_id, (lessonCount.get(l.course_id) ?? 0) + 1)
    }
    for (const e of enrollRes.data ?? []) {
      studentCount.set(e.course_id, (studentCount.get(e.course_id) ?? 0) + 1)
    }
  }

  const pageHref = (n: number) => {
    const s = new URLSearchParams()
    if (sp.q) s.set('q', sp.q)
    if (status) s.set('status', status)
    if (n > 1) s.set('page', String(n))
    const qs = s.toString()
    return qs ? `/admin/courses?${qs}` : '/admin/courses'
  }

  return (
    <div>
      <PageHeader
        title="الكورسات"
        description="أنشئ الكورسات ونظّم الوحدات والدروس وتحكّم في نشرها."
        action={
          <Link href="/admin/courses/new" className={NEW_COURSE_LINK}>
            <Plus className="size-4" aria-hidden />
            كورس جديد
          </Link>
        }
      />

      <Card>
        <CoursesFilters />

        <p className="nums-ar border-b border-border-subtle px-4 py-2.5 text-sm text-ink-faint">
          {formatNumber(total)} كورس
        </p>

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={filtered ? 'لا توجد كورسات مطابقة' : 'لا توجد كورسات بعد'}
            description={
              filtered
                ? 'جرّب تعديل البحث أو إزالة الفلتر.'
                : 'أنشئ أول كورس لتبدأ في إضافة الوحدات والدروس ونشرها للطلاب.'
            }
            action={
              filtered ? undefined : (
                <Link href="/admin/courses/new" className={NEW_COURSE_LINK}>
                  <Plus className="size-4" aria-hidden />
                  كورس جديد
                </Link>
              )
            }
          />
        ) : (
          <ul className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {courses.map((c) => (
              <li
                key={c.id}
                className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raise)]"
              >
                <Link href={`/admin/courses/${c.id}`} className="relative block">
                  <CourseCover url={c.thumbnail_url} title={c.title} />
                  <span className="absolute start-3 top-3">
                    <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                  </span>
                </Link>

                {/* خارج الرابط: زرّ داخل رابط تركيبٌ غير صالح ويسرق النقرة */}
                <span className="absolute end-3 top-3 rounded-[var(--radius-field)] bg-surface/90 shadow-[var(--shadow-card)] backdrop-blur-sm">
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

                <Link href={`/admin/courses/${c.id}`} className="flex flex-1 flex-col p-5">
                  {c.grades?.name_ar && (
                    <span className="text-sm font-semibold text-accent-ink">{c.grades.name_ar}</span>
                  )}
                  <h3 className="mb-4 mt-0.5 line-clamp-2 text-lg font-semibold leading-snug text-ink">
                    {c.title}
                  </h3>

                  <p className="nums-ar mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-subtle pt-3 text-sm text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <LayoutList className="size-4 text-ink-faint" aria-hidden />
                      {formatNumber(lessonCount.get(c.id) ?? 0)} درس
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4 text-ink-faint" aria-hidden />
                      {formatNumber(studentCount.get(c.id) ?? 0)} طالب
                    </span>
                    <span className="ms-auto font-semibold text-ink">
                      {c.price > 0 ? formatPrice(c.price) : 'مجاني'}
                    </span>
                  </p>
                  <p className="nums-ar mt-2 text-xs text-ink-faint">
                    آخر تحديث {formatDate(c.updated_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="صفحات النتائج"
            className="flex items-center justify-between gap-3 border-t border-border-subtle px-4 py-3"
          >
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-field)] border border-border-strong px-3 text-base hover:bg-surface-muted"
              >
                <ChevronRight className="size-4" aria-hidden />
                السابق
              </Link>
            ) : (
              <span />
            )}

            <span className="nums-ar text-sm text-ink-faint">
              صفحة {formatNumber(page)} من {formatNumber(totalPages)}
            </span>

            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-field)] border border-border-strong px-3 text-base hover:bg-surface-muted"
              >
                التالي
                <ChevronLeft className="size-4" aria-hidden />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </Card>
    </div>
  )
}
