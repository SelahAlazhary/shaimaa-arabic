import type { Metadata } from 'next'
import { GraduationCap } from 'lucide-react'
import { requireAdminPage } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { GradesManager, type StageRow } from '@/components/admin/grades-manager'

export const metadata: Metadata = { title: 'الصفوف الدراسية' }

export default async function AdminGradesPage() {
  await requireAdminPage('grades')
  const supabase = await createClient()

  const [stagesRes, gradesRes, studentsRes] = await Promise.all([
    supabase.from('education_stages').select('id, name_ar, is_visible, sort_order').order('sort_order'),
    supabase.from('grades').select('id, name_ar, is_visible, sort_order, stage_id').order('sort_order'),
    supabase.from('profiles').select('grade_id').eq('role', 'student'),
  ])

  const perGrade = new Map<string, number>()
  for (const s of studentsRes.data ?? []) {
    if (s.grade_id) perGrade.set(s.grade_id, (perGrade.get(s.grade_id) ?? 0) + 1)
  }

  const grades = gradesRes.data ?? []

  const stages: StageRow[] = (stagesRes.data ?? []).map((stage) => ({
    id: stage.id,
    name: stage.name_ar,
    visible: stage.is_visible,
    grades: grades
      .filter((g) => g.stage_id === stage.id)
      .map((g) => ({
        id: g.id,
        name: g.name_ar,
        visible: g.is_visible,
        students: perGrade.get(g.id) ?? 0,
      })),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="الصفوف الدراسية"
        description="المراحل والصفوف التي تظهر للطالب عند التسجيل. الإخفاء يمنع ظهور الصف للمسجّلين الجدد ولا يمسّ من اختاره من قبل."
      />

      <Card>
        <CardHeader title="المراحل والصفوف" icon={GraduationCap} />
        <GradesManager stages={stages} />
      </Card>
    </div>
  )
}
