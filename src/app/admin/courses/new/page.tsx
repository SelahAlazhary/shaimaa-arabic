import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { CourseForm } from '@/components/admin/course-form'
import { BookOpen } from 'lucide-react'

export const metadata: Metadata = { title: 'مقرر جديد' }

export default async function NewCoursePage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: grades } = await supabase
    .from('grades')
    .select('id, name_ar')
    .order('sort_order', { ascending: true })

  return (
    <div>
      <Link
        href="/admin/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-base text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        كل المقررات
      </Link>

      <PageHeader
        title="مقرر جديد"
        description="أدخل بيانات المقرر، ثم أضف الوحدات والدروس في الخطوة التالية."
      />

      <Card>
        <CardHeader title="بيانات المقرر" icon={BookOpen} />
        <CourseForm grades={grades ?? []} />
      </Card>
    </div>
  )
}
