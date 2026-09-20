import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ClipboardList } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ExamForm } from '@/components/admin/exam-form'

export const metadata: Metadata = { title: 'اختبار جديد' }

export default async function NewExamPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: courses } = await supabase.from('courses').select('id, title').order('title')

  return (
    <div>
      <Link
        href="/admin/exams"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        كل الاختبارات
      </Link>

      <PageHeader
        title="اختبار جديد"
        description="أدخل إعدادات الاختبار، ثم أضف الأسئلة وانشره."
      />

      <Card>
        <CardHeader title="إعدادات الاختبار" icon={ClipboardList} />
        <ExamForm courses={courses ?? []} />
      </Card>
    </div>
  )
}
