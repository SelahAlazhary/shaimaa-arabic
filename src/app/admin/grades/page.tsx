import type { Metadata } from 'next'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'الصفوف الدراسية' }

export default async function AdminGradesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [stagesRes, gradesRes, studentsRes] = await Promise.all([
    supabase.from('education_stages').select('id, name_ar, sort_order').order('sort_order'),
    supabase.from('grades').select('id, name_ar, name_en, is_visible, sort_order, stage_id').order('sort_order'),
    supabase.from('profiles').select('grade_id').eq('role', 'student'),
  ])

  const stages = stagesRes.data ?? []
  const grades = gradesRes.data ?? []
  const perGrade = new Map<string, number>()
  for (const s of studentsRes.data ?? []) {
    if (s.grade_id) perGrade.set(s.grade_id, (perGrade.get(s.grade_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الصفوف الدراسية"
        description="المراحل والصفوف التي تظهر للطالب عند التسجيل."
      />

      {stages.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="لا توجد مراحل"
            description="أضف مرحلة دراسية أولًا ثم أضف صفوفها."
          />
        </Card>
      ) : (
        stages.map((stage) => {
          const stageGrades = grades.filter((g) => g.stage_id === stage.id)
          return (
            <Card key={stage.id}>
              <CardHeader
                title={stage.name_ar}
                icon={GraduationCap}
                action={
                  <span className="nums-ar text-xs text-ink-faint">
                    {formatNumber(stageGrades.length)} صف
                  </span>
                }
              />

              {stageGrades.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="لا صفوف في هذه المرحلة"
                  description="أضف صفوف هذه المرحلة لتظهر للطالب في نموذج التسجيل."
                />
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {stageGrades.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{g.name_ar}</span>
                        {g.name_en && (
                          <span className="block text-xs text-ink-faint" dir="ltr">{g.name_en}</span>
                        )}
                      </span>

                      <span className="flex shrink-0 items-center gap-3">
                        <span className="nums-ar text-xs text-ink-faint">
                          {formatNumber(perGrade.get(g.id) ?? 0)} طالب
                        </span>
                        <Badge tone={g.is_visible ? 'success' : 'neutral'}>
                          <span className="flex items-center gap-1">
                            {g.is_visible ? <Eye className="size-3" aria-hidden /> : <EyeOff className="size-3" aria-hidden />}
                            {g.is_visible ? 'ظاهر' : 'مخفي'}
                          </span>
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
