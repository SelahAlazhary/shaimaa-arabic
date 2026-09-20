import type { Metadata } from 'next'
import { FileText, Upload } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState } from '@/components/ui/card'
import { AttachmentRow } from '@/components/admin/attachment-row'
import { PageHeader } from '@/components/ui/page-header'
import { AttachmentUploadForm } from '@/components/admin/attachment-upload-form'
import { formatFileSize, formatDate, formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'المرفقات' }

export default async function AdminAttachmentsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [filesRes, linksRes, coursesRes] = await Promise.all([
    supabase
      .from('attachments')
      .select('id, title, file_name, file_size, mime_type, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('course_attachments').select('attachment_id, course_id, courses(title)'),
    supabase.from('courses').select('id, title').order('title'),
  ])

  const links = new Map<string, { courseId: string; title: string }[]>()
  for (const row of (linksRes.data ?? []) as unknown as {
    attachment_id: string
    course_id: string
    courses: { title: string } | null
  }[]) {
    if (!row.courses?.title) continue
    links.set(row.attachment_id, [
      ...(links.get(row.attachment_id) ?? []),
      { courseId: row.course_id, title: row.courses.title },
    ])
  }

  const files = filesRes.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="المرفقات"
        description="الملازم والمذكرات. الملف يُرفع مرة واحدة ويُربط بعدة كورسات."
      />

      <Card>
        <CardHeader title="رفع مرفق جديد" icon={Upload} />
        <AttachmentUploadForm courses={coursesRes.data ?? []} />
      </Card>

      <Card>
        <CardHeader
          title="الملفات"
          icon={FileText}
          action={
            <span className="nums-ar text-sm text-ink-faint">{formatNumber(files.length)} ملف</span>
          }
        />

        {files.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="لا توجد مرفقات"
            description="ارفع أول ملف من الأعلى واربطه بكورس ليظهر للطلاب المشتركين فيه."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {files.map((f) => (
              <AttachmentRow
                key={f.id}
                file={{
                  id: f.id,
                  title: f.title,
                  meta: `${f.file_name} · ${formatFileSize(f.file_size)} · ${formatDate(f.created_at)}`,
                }}
                courses={links.get(f.id) ?? []}
                allCourses={coursesRes.data ?? []}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
