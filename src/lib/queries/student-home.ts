import { createClient } from '@/lib/supabase/server'

/**
 * بيانات الشاشة الرئيسية للطالب.
 * RLS تتكفّل بالتصفية — لا نُمرّر student_id في أي استعلام، فالقاعدة
 * لا ترى أصلًا إلا صفوف صاحب الجلسة.
 * الأعمدة محدّدة بالاسم: ممنوع select * (البند 37).
 */

export type EnrolledCourse = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  expiresAt: string | null
  totalLessons: number
  completedLessons: number
  percent: number
}

export type AttachmentItem = {
  id: string
  title: string
  fileName: string
  fileSize: number
  courseTitle: string
}

export type UpcomingLive = {
  id: string
  title: string
  startsAt: string
  courseTitle: string | null
}

export type StudentHome = {
  courses: EnrolledCourse[]
  attachments: AttachmentItem[]
  upcoming: UpcomingLive[]
  unreadNotifications: number
  availableExams: number
  overallPercent: number
}

export async function getStudentHome(): Promise<StudentHome> {
  const supabase = await createClient()

  const [enrollmentsRes, notifRes, examsRes, liveRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('expires_at, courses!inner(id, title, slug, thumbnail_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false),
    supabase.from('exams').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase
      .from('live_streams')
      .select('id, title, starts_at, courses(title)')
      .in('status', ['scheduled', 'live'])
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(3),
  ])

  const enrollments = enrollmentsRes.data ?? []
  const courseIds = enrollments.map((e) => e.courses.id)

  // الدروس والتقدّم في استعلامين فقط، ثم التجميع في الذاكرة:
  // أرخص بكثير من استعلام لكل كورس (البند 37)
  const [lessonsRes, progressRes, attachRes] = await Promise.all([
    courseIds.length
      ? supabase.from('lessons').select('id, course_id').eq('is_published', true).in('course_id', courseIds)
      : Promise.resolve({ data: [] as { id: string; course_id: string }[] }),
    courseIds.length
      ? supabase.from('lesson_progress').select('lesson_id').eq('completed', true)
      : Promise.resolve({ data: [] as { lesson_id: string }[] }),
    courseIds.length
      ? supabase
          .from('course_attachments')
          .select('attachments!inner(id, title, file_name, file_size), courses!inner(title)')
          .in('course_id', courseIds)
          .limit(5)
      : Promise.resolve({ data: [] as never[] }),
  ])

  const lessons = lessonsRes.data ?? []
  const completed = new Set((progressRes.data ?? []).map((p) => p.lesson_id))

  const courses: EnrolledCourse[] = enrollments.map((e) => {
    const courseLessons = lessons.filter((l) => l.course_id === e.courses.id)
    const done = courseLessons.filter((l) => completed.has(l.id)).length
    return {
      id: e.courses.id,
      title: e.courses.title,
      slug: e.courses.slug,
      thumbnailUrl: e.courses.thumbnail_url,
      expiresAt: e.expires_at,
      totalLessons: courseLessons.length,
      completedLessons: done,
      percent: courseLessons.length === 0 ? 0 : Math.round((done / courseLessons.length) * 100),
    }
  })

  const overallPercent =
    courses.length === 0 ? 0 : Math.round(courses.reduce((s, c) => s + c.percent, 0) / courses.length)

  const attachments: AttachmentItem[] = (
    (attachRes.data ?? []) as unknown as {
      attachments: { id: string; title: string; file_name: string; file_size: number }
      courses: { title: string }
    }[]
  ).map((row) => ({
    id: row.attachments.id,
    title: row.attachments.title,
    fileName: row.attachments.file_name,
    fileSize: row.attachments.file_size,
    courseTitle: row.courses.title,
  }))

  const upcoming: UpcomingLive[] = (
    (liveRes.data ?? []) as unknown as {
      id: string
      title: string
      starts_at: string
      courses: { title: string } | null
    }[]
  ).map((l) => ({
    id: l.id,
    title: l.title,
    startsAt: l.starts_at,
    courseTitle: l.courses?.title ?? null,
  }))

  return {
    courses,
    attachments,
    upcoming,
    unreadNotifications: notifRes.count ?? 0,
    availableExams: examsRes.count ?? 0,
    overallPercent,
  }
}
