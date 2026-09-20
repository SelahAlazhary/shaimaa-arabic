import { createClient } from '@/lib/supabase/server'

/**
 * تفاصيل مقرر واحد.
 * RLS تتكفّل بكل شيء: المقرر غير المنشور لا يعود، والدروس تعود كفهرس
 * بلا روابط فيديو، ورابط الفيديو في lesson_videos لا يعود إلا لمن يستحقه.
 */

export type OutlineLesson = {
  id: string
  title: string
  description: string | null
  durationSeconds: number
  isFree: boolean
  hasVideo: boolean
  completed: boolean
  progressPercent: number
}

export type OutlineModule = {
  id: string | null
  title: string
  lessons: OutlineLesson[]
}

export type CourseOutline = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  gradeName: string | null
  enrolled: boolean
  expiresAt: string | null
  modules: OutlineModule[]
  totalLessons: number
  completedLessons: number
  percent: number
  attachments: { id: string; title: string; fileName: string; fileSize: number }[]
}

export async function getCourseOutline(slug: string): Promise<CourseOutline | null> {
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, description, thumbnail_url, grades(name_ar)')
    .eq('slug', slug)
    .maybeSingle()

  if (!course) return null

  const c = course as unknown as {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnail_url: string | null
    grades: { name_ar: string } | null
  }

  const [enrollmentRes, modulesRes, lessonsRes, progressRes, attachRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('expires_at')
      .eq('course_id', c.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase.from('course_modules').select('id, title, sort_order').eq('course_id', c.id).order('sort_order'),
    supabase
      .from('lessons')
      .select('id, title, description, duration_seconds, is_free, has_video, module_id, sort_order')
      .eq('course_id', c.id)
      .eq('is_published', true)
      .order('sort_order'),
    supabase.from('lesson_progress').select('lesson_id, completed, progress_percent'),
    supabase
      .from('course_attachments')
      .select('attachments!inner(id, title, file_name, file_size)')
      .eq('course_id', c.id),
  ])

  const progress = new Map(
    (progressRes.data ?? []).map((p) => [p.lesson_id, p] as const),
  )

  const rows = (lessonsRes.data ?? []) as {
    id: string
    title: string
    description: string | null
    duration_seconds: number
    is_free: boolean
    has_video: boolean
    module_id: string | null
    sort_order: number
  }[]

  const toLesson = (l: (typeof rows)[number]): OutlineLesson => {
    const p = progress.get(l.id)
    return {
      id: l.id,
      title: l.title,
      description: l.description,
      durationSeconds: l.duration_seconds,
      isFree: l.is_free,
      hasVideo: l.has_video,
      completed: p?.completed ?? false,
      progressPercent: Number(p?.progress_percent ?? 0),
    }
  }

  const modules: OutlineModule[] = (modulesRes.data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    lessons: rows.filter((l) => l.module_id === m.id).map(toLesson),
  }))

  // دروس بلا وحدة: تُعرض في مجموعة واحدة بدل أن تختفي من الفهرس
  const loose = rows.filter((l) => !l.module_id).map(toLesson)
  if (loose.length > 0) {
    modules.push({ id: null, title: modules.length > 0 ? 'دروس إضافية' : 'الدروس', lessons: loose })
  }

  const totalLessons = rows.length
  const completedLessons = rows.filter((l) => progress.get(l.id)?.completed).length

  const attachments = (
    (attachRes.data ?? []) as unknown as {
      attachments: { id: string; title: string; file_name: string; file_size: number }
    }[]
  ).map((r) => ({
    id: r.attachments.id,
    title: r.attachments.title,
    fileName: r.attachments.file_name,
    fileSize: r.attachments.file_size,
  }))

  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    thumbnailUrl: c.thumbnail_url,
    gradeName: c.grades?.name_ar ?? null,
    enrolled: Boolean(enrollmentRes.data),
    expiresAt: enrollmentRes.data?.expires_at ?? null,
    modules,
    totalLessons,
    completedLessons,
    percent: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
    attachments,
  }
}

export type LessonView = {
  id: string
  title: string
  description: string | null
  durationSeconds: number
  courseId: string
  courseTitle: string
  courseSlug: string
  videoUrl: string | null
  provider: string | null
  watchedSeconds: number
  completed: boolean
  prevId: string | null
  nextId: string | null
}

export async function getLesson(slug: string, lessonId: string): Promise<LessonView | null> {
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, description, duration_seconds, course_id, courses!inner(title, slug)')
    .eq('id', lessonId)
    .eq('is_published', true)
    .maybeSingle()

  if (!lesson) return null

  const l = lesson as unknown as {
    id: string
    title: string
    description: string | null
    duration_seconds: number
    course_id: string
    courses: { title: string; slug: string }
  }

  if (l.courses.slug !== slug) return null

  // الرابط يعود فقط إذا سمحت سياسة lesson_videos — أي للمسجَّل أو للدرس المجاني
  const [videoRes, progressRes, siblingsRes] = await Promise.all([
    supabase.from('lesson_videos').select('video_url, provider').eq('lesson_id', l.id).maybeSingle(),
    supabase
      .from('lesson_progress')
      .select('watched_seconds, completed')
      .eq('lesson_id', l.id)
      .maybeSingle(),
    supabase
      .from('lessons')
      .select('id, sort_order')
      .eq('course_id', l.course_id)
      .eq('is_published', true)
      .order('sort_order'),
  ])

  const siblings = siblingsRes.data ?? []
  const index = siblings.findIndex((s) => s.id === l.id)

  return {
    id: l.id,
    title: l.title,
    description: l.description,
    durationSeconds: l.duration_seconds,
    courseId: l.course_id,
    courseTitle: l.courses.title,
    courseSlug: l.courses.slug,
    videoUrl: videoRes.data?.video_url ?? null,
    provider: videoRes.data?.provider ?? null,
    watchedSeconds: progressRes.data?.watched_seconds ?? 0,
    completed: progressRes.data?.completed ?? false,
    prevId: index > 0 ? (siblings[index - 1]?.id ?? null) : null,
    nextId: index >= 0 && index < siblings.length - 1 ? (siblings[index + 1]?.id ?? null) : null,
  }
}
