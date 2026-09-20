import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, BookOpen, Plus, Layers, Eye, EyeOff, Clock, ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { CourseForm } from '@/components/admin/course-form'
import { LessonForm } from '@/components/admin/lesson-form'
import { ModuleForm } from '@/components/admin/module-form'
import { LessonList, type LessonRow } from '@/components/admin/lesson-list'
import { ModuleList } from '@/components/admin/module-list'
import { formatNumber, formatDuration } from '@/lib/utils/format'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('title').eq('id', id).maybeSingle()
  return { title: data?.title ?? 'الكورس' }
}

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const [courseRes, gradesRes, modulesRes, lessonsRes, videosRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, grade_id, price, status, slug')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('grades').select('id, name_ar').order('sort_order'),
    supabase.from('course_modules').select('id, title').eq('course_id', id).order('sort_order'),
    supabase
      .from('lessons')
      .select('id, title, description, duration_seconds, is_free, is_published, module_id, sort_order')
      .eq('course_id', id)
      .order('sort_order'),
    supabase.from('lesson_videos').select('lesson_id, video_url'),
  ])

  const course = courseRes.data
  if (!course) notFound()

  const modules = modulesRes.data ?? []
  const lessons = lessonsRes.data ?? []
  const withVideo = new Set((videosRes.data ?? []).map((v) => v.lesson_id))
  // الرابط نفسه لازم لنموذج التعديل: حفظُه فارغًا يحذف الفيديو من الدرس
  const videoUrlOf = new Map((videosRes.data ?? []).map((v) => [v.lesson_id, v.video_url]))
  const moduleName = new Map(modules.map((m) => [m.id, m.title] as const))

  const lessonRows: LessonRow[] = lessons.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description ?? '',
    videoUrl: videoUrlOf.get(l.id) ?? '',
    durationMinutes: l.duration_seconds ? String(Math.round(l.duration_seconds / 60)) : '',
    moduleId: l.module_id ?? '',
    isFree: l.is_free,
    isPublished: l.is_published,
    durationSeconds: l.duration_seconds,
    moduleTitle: l.module_id ? (moduleName.get(l.module_id) ?? null) : null,
    hasVideo: withVideo.has(l.id),
  }))

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        كل الكورسات
      </Link>

      <PageHeader
        title={course.title}
        description="عدّل بيانات الكورس، ونظّم وحداته ودروسه."
        action={
          course.status === 'published' ? (
            <Link
              href={`/student/courses/${course.slug}`}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              <ExternalLink className="size-4" aria-hidden />
              معاينة كطالب
            </Link>
          ) : undefined
        }
      />

      <Card>
        <CardHeader title="بيانات الكورس" icon={BookOpen} />
        <CourseForm
          grades={gradesRes.data ?? []}
          defaults={{
            id: course.id,
            title: course.title,
            description: course.description ?? '',
            gradeId: course.grade_id ?? '',
            price: course.price ? String(course.price) : '',
            status: course.status,
            slug: course.slug,
          }}
        />
      </Card>

      <Card>
        <CardHeader
          title="الوحدات"
          icon={Layers}
          action={
            <span className="nums-ar text-xs text-ink-faint">
              {formatNumber(modules.length)} وحدة
            </span>
          }
        />
        <ModuleForm courseId={course.id} />
        <ModuleList
          courseId={course.id}
          modules={modules.map((m) => ({
            id: m.id,
            title: m.title,
            lessonCount: lessons.filter((l) => l.module_id === m.id).length,
          }))}
        />
      </Card>

      <Card>
        <CardHeader title="إضافة درس" icon={Plus} />
        <LessonForm courseId={course.id} modules={modules} />
      </Card>

      <Card>
        <CardHeader
          title="دروس الكورس"
          icon={BookOpen}
          action={
            <span className="nums-ar text-xs text-ink-faint">
              {formatNumber(lessons.length)} درس
            </span>
          }
        />

        <LessonList courseId={course.id} modules={modules} lessons={lessonRows} />
      </Card>
    </div>
  )
}
