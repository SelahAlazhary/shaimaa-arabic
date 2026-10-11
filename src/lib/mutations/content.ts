'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toErrorCode, messageFor } from '@/lib/errors'
import { formatNumber } from '@/lib/utils/format'
import {
  courseSchema,
  lessonSchema,
  moduleSchema,
  liveSchema,
  generateSlug,
} from '@/lib/validations/content'

export type FormState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> }
  | { status: 'success'; message: string }

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '')

const fieldErrorsFrom = (issues: { path: PropertyKey[]; message: string }[]) => {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !out[key]) out[key] = issue.message
  }
  return out
}

const invalid = (issues: { path: PropertyKey[]; message: string }[]): FormState => ({
  status: 'error',
  message: 'راجع البيانات المدخلة.',
  fieldErrors: fieldErrorsFrom(issues),
})

const failed = (error: unknown): FormState => ({
  status: 'error',
  message: messageFor(toErrorCode(error)),
})

/**
 * كل إجراء هنا للإدارة فقط.
 * الصلاحية مفروضة بسياسات RLS على الجداول؛ الفحص المسبق هنا لتقديم رسالة
 * عربية واضحة بدل خطأ قاعدة بيانات خام (البند 27 + البند 38).
 */
async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) return null

  return supabase
}

// ===== الكورسات =====

export async function saveCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = courseSchema.safeParse({
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    gradeId: text(formData, 'gradeId'),
    price: text(formData, 'price'),
    status: text(formData, 'status'),
    slug: text(formData, 'slug'),
  })

  if (!parsed.success) return invalid(parsed.error.issues)

  const supabase = await adminClient()
  if (!supabase) return { status: 'error', message: messageFor('FORBIDDEN') }

  const id = text(formData, 'id')
  const v = parsed.data

  const payload = {
    title: v.title,
    description: v.description || null,
    grade_id: v.gradeId || null,
    price: v.price ? Number(v.price) : 0,
    status: v.status,
    slug: v.slug || generateSlug(),
  }

  if (id) {
    const { error } = await supabase.from('courses').update(payload).eq('id', id)
    if (error) return failed(error)
    revalidatePath('/admin/courses')
    revalidatePath('/student', 'layout')
    return { status: 'success', message: 'تم حفظ التعديلات.' }
  }

  const { data, error } = await supabase.from('courses').insert(payload).select('id').single()
  if (error || !data) return failed(error)

  revalidatePath('/admin/courses')
  redirect(`/admin/courses/${data.id}`)
}

// ===== الوحدات =====

export async function addModule(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = moduleSchema.safeParse({
    courseId: text(formData, 'courseId'),
    title: text(formData, 'title'),
  })
  if (!parsed.success) return invalid(parsed.error.issues)

  const supabase = await adminClient()
  if (!supabase) return { status: 'error', message: messageFor('FORBIDDEN') }

  const { count } = await supabase
    .from('course_modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', parsed.data.courseId)

  const { error } = await supabase.from('course_modules').insert({
    course_id: parsed.data.courseId,
    title: parsed.data.title,
    sort_order: (count ?? 0) + 1,
  })

  if (error) return failed(error)

  revalidatePath(`/admin/courses/${parsed.data.courseId}`)
  return { status: 'success', message: 'تمت إضافة الوحدة.' }
}

export async function renameModule(moduleId: string, courseId: string, title: string) {
  const clean = title.trim()
  if (clean.length < 2) return { ok: false, message: 'اسم الوحدة قصير جدًا.' }
  if (clean.length > 150) return { ok: false, message: 'اسم الوحدة طويل جدًا.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { error } = await supabase
    .from('course_modules')
    .update({ title: clean })
    .eq('id', moduleId)

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/student', 'layout')
  return { ok: true, message: 'تم تغيير اسم الوحدة.' }
}

/**
 * حذف وحدة لا يحذف دروسها: `lessons.module_id` عليه `ON DELETE SET NULL`،
 * فتعود الدروس «بلا وحدة» وتبقى كاملة بتقدّم الطلاب فيها.
 */
export async function deleteModule(moduleId: string, courseId: string) {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { count } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('module_id', moduleId)

  const { error } = await supabase.from('course_modules').delete().eq('id', moduleId)
  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/student', 'layout')

  return {
    ok: true,
    message: count
      ? `حُذفت الوحدة، ودروسها (${formatNumber(count)}) صارت بلا وحدة.`
      : 'تم حذف الوحدة.',
  }
}

/**
 * حذف كورس: مسموح فقط ما دام لم يشترك فيه أحد ولم تُصدَر له أكواد.
 * القاعدة نفسها تمنعه (`enrollments` و`activation_codes` عليهما RESTRICT)،
 * لكننا نفحص أولًا لنقول للمستخدمة السبب بدل خطأ مفتاح أجنبي خام.
 * وما يسقط معه محتوى فقط: الدروس والوحدات والاختبارات والبث وروابط المرفقات.
 */
export async function deleteCourse(courseId: string) {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const [enrollments, codes] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
    supabase.from('activation_codes').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
  ])

  if (enrollments.count) {
    return {
      ok: false,
      message: `لا يمكن حذف كورس اشترك فيه ${formatNumber(enrollments.count)} طالب — الحذف يمحو اشتراكاتهم وتقدّمهم. أرشفي الكورس بدل حذفه.`,
    }
  }

  if (codes.count) {
    return {
      ok: false,
      message: `لهذا الكورس ${formatNumber(codes.count)} كود تفعيل. احذفي الأكواد أولًا أو أرشفي الكورس.`,
    }
  }

  const { error } = await supabase.from('courses').delete().eq('id', courseId)
  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/courses')
  revalidatePath('/student', 'layout')
  return { ok: true, message: 'تم حذف الكورس.' }
}

// ===== الدروس =====

export async function saveLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = lessonSchema.safeParse({
    courseId: text(formData, 'courseId'),
    moduleId: text(formData, 'moduleId'),
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    videoUrl: text(formData, 'videoUrl'),
    durationMinutes: text(formData, 'durationMinutes'),
    isFree: text(formData, 'isFree'),
    isPublished: text(formData, 'isPublished'),
  })

  if (!parsed.success) return invalid(parsed.error.issues)

  const supabase = await adminClient()
  if (!supabase) return { status: 'error', message: messageFor('FORBIDDEN') }

  const id = text(formData, 'id')
  const v = parsed.data

  const payload = {
    course_id: v.courseId,
    module_id: v.moduleId || null,
    title: v.title,
    description: v.description || null,
    duration_seconds: v.durationMinutes ? Number(v.durationMinutes) * 60 : 0,
    is_free: v.isFree === 'on',
    is_published: v.isPublished === 'on',
  }

  let lessonId = id

  if (id) {
    const { error } = await supabase.from('lessons').update(payload).eq('id', id)
    if (error) return failed(error)
  } else {
    const { count } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', v.courseId)

    const { data, error } = await supabase
      .from('lessons')
      .insert({ ...payload, sort_order: (count ?? 0) + 1 })
      .select('id')
      .single()

    if (error || !data) return failed(error)
    lessonId = data.id
  }

  // رابط الفيديو في جدول منفصل: وجوده يعني محتوى مدفوعًا محميًا بسياسته
  if (v.videoUrl) {
    const { error } = await supabase
      .from('lesson_videos')
      .upsert({ lesson_id: lessonId, video_url: v.videoUrl }, { onConflict: 'lesson_id' })
    if (error) return failed(error)
  } else {
    await supabase.from('lesson_videos').delete().eq('lesson_id', lessonId)
  }

  revalidatePath(`/admin/courses/${v.courseId}`)
  revalidatePath('/student', 'layout')

  return { status: 'success', message: id ? 'تم حفظ الدرس.' : 'تمت إضافة الدرس.' }
}

/**
 * الدرس يُخفى ولا يُحذف.
 * الحذف يُسقط سجلات تقدّم الطلاب معه (ON DELETE CASCADE) فيضيع تاريخهم —
 * والبند 10 يمنع الحذف الأعمى للسجلات الحرجة.
 */
export async function toggleLessonPublished(lessonId: string, courseId: string, next: boolean) {
  const supabase = await adminClient()
  if (!supabase) return { ok: false }

  const { error } = await supabase
    .from('lessons')
    .update({ is_published: next })
    .eq('id', lessonId)

  if (error) return { ok: false }

  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/student', 'layout')
  return { ok: true }
}

/**
 * إعادة ترتيب الدروس داخل وحدتها.
 * التبديل يجري في دالة واحدة على الخادم، فلا يترك انقطاعٌ ترتيبًا نصفَ مُطبَّق.
 */
export async function moveLesson(lessonId: string, courseId: string, direction: 'up' | 'down') {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { data, error } = await supabase.rpc('move_lesson', {
    p_lesson: lessonId,
    p_dir: direction,
  })

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/student', 'layout')

  // `false` تعني أن الدرس في طرف قائمته أصلًا — ليست فشلًا
  return { ok: true, message: data ? 'تم تغيير الترتيب.' : 'الدرس في طرف القائمة.' }
}

// ===== البث المباشر =====

export async function saveLiveStream(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = liveSchema.safeParse({
    courseId: text(formData, 'courseId'),
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    streamUrl: text(formData, 'streamUrl'),
    recordingUrl: text(formData, 'recordingUrl'),
    startsAt: text(formData, 'startsAt'),
    status: text(formData, 'status'),
  })

  if (!parsed.success) return invalid(parsed.error.issues)

  const supabase = await adminClient()
  if (!supabase) return { status: 'error', message: messageFor('FORBIDDEN') }

  const v = parsed.data
  const startsAt = new Date(v.startsAt)
  if (Number.isNaN(startsAt.getTime())) {
    return { status: 'error', message: 'راجع البيانات المدخلة.', fieldErrors: { startsAt: 'موعد غير صحيح' } }
  }

  const payload = {
    course_id: v.courseId || null,
    title: v.title,
    description: v.description || null,
    stream_url: v.streamUrl || null,
    recording_url: v.recordingUrl || null,
    starts_at: startsAt.toISOString(),
    status: v.status,
  }

  const id = text(formData, 'id')

  const { error } = id
    ? await supabase.from('live_streams').update(payload).eq('id', id)
    : await supabase.from('live_streams').insert(payload)

  if (error) return failed(error)

  revalidatePath('/admin/live')
  revalidatePath('/student', 'layout')

  return { status: 'success', message: id ? 'تم حفظ الحصة.' : 'تمت جدولة الحصة.' }
}
