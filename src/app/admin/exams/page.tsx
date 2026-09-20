import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, Plus, Pencil, Trash2 } from 'lucide-react'
import { deleteExam } from '@/lib/mutations/exams'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'الاختبارات' }

export default async function AdminExamsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [examsRes, questionsRes, attemptsRes] = await Promise.all([
    supabase
      .from('exams')
      .select(
        'id, title, duration_minutes, passing_percentage, max_attempts, is_published, courses(title)',
      )
      .order('created_at', { ascending: false }),
    supabase.from('exam_questions').select('exam_id'),
    supabase.from('exam_attempts').select('exam_id').eq('status', 'submitted'),
  ])

  const exams = (examsRes.data ?? []) as unknown as {
    id: string
    title: string
    duration_minutes: number | null
    passing_percentage: number
    max_attempts: number | null
    is_published: boolean
    courses: { title: string } | null
  }[]

  const qCount = new Map<string, number>()
  for (const q of questionsRes.data ?? []) qCount.set(q.exam_id, (qCount.get(q.exam_id) ?? 0) + 1)

  const aCount = new Map<string, number>()
  for (const a of attemptsRes.data ?? []) aCount.set(a.exam_id, (aCount.get(a.exam_id) ?? 0) + 1)

  return (
    <div>
      <PageHeader
        title="الاختبارات"
        description="اختبارات المنصة وحالة نشرها ونتائج الطلاب."
        action={
          <Link
            href="/admin/exams/new"
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] bg-brand-700 px-4 text-sm font-medium text-ink-invert transition-colors hover:bg-brand-800"
          >
            <Plus className="size-4" aria-hidden />
            اختبار جديد
          </Link>
        }
      />

      <Card>
        <CardHeader title="قائمة الاختبارات" icon={ClipboardList} />

        {exams.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="لا توجد اختبارات"
            description="أنشئ اختبارًا وأضف أسئلته، ثم انشره ليظهر لطلاب الكورس."
            action={
              <Link
                href="/admin/exams/new"
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] bg-brand-700 px-4 text-sm font-medium text-ink-invert transition-colors hover:bg-brand-800"
              >
                <Plus className="size-4" aria-hidden />
                اختبار جديد
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {exams.map((e) => (
              <li key={e.id} className="flex items-stretch">
                <Link
                  href={`/admin/exams/${e.id}`}
                  className="min-w-0 flex-1 px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{e.title}</p>
                    {e.courses?.title && (
                      <p className="mt-0.5 text-xs text-ink-muted">{e.courses.title}</p>
                    )}
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone={e.is_published ? 'success' : 'neutral'}>
                      {e.is_published ? 'منشور' : 'مسودّة'}
                    </Badge>
                    <Pencil className="size-3.5 text-ink-faint" aria-hidden />
                  </span>
                </div>

                <p className="nums-ar mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
                  <span>{formatNumber(qCount.get(e.id) ?? 0)} سؤال</span>
                  <span>{formatNumber(aCount.get(e.id) ?? 0)} محاولة</span>
                  <span>
                    {e.duration_minutes
                      ? `${formatNumber(e.duration_minutes)} دقيقة`
                      : 'بدون مؤقّت'}
                  </span>
                  <span>النجاح {formatNumber(Math.round(e.passing_percentage))}٪</span>
                </p>
                </Link>

                <span className="flex shrink-0 items-center pe-2 ps-3">
                  <ConfirmButton
                    label=""
                    srLabel={`حذف ${e.title}`}
                    icon={<Trash2 aria-hidden />}
                    title="حذف الاختبار؟"
                    body={`سيُحذف «${e.title}» بكل أسئلته. الحذف ممنوع إن كان طلاب قد بدأوه.`}
                    confirmLabel="احذف الاختبار"
                    action={deleteExam.bind(null, e.id)}
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
