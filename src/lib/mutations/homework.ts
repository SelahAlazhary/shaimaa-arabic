'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { messageFor, toErrorCode } from '@/lib/errors'
import { formatNumber } from '@/lib/utils/format'

async function adminClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) return null

  return { supabase, userId: user.id }
}

const refresh = (courseId: string) => {
  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/admin/exams')
  revalidatePath('/student', 'layout')
}

/**
 * واجب جديد لدرس.
 *
 * الواجب اختبار عادي مربوط بالدرس، فيرث محرّر الأسئلة والتصحيح
 * التلقائي والمراجعة كما هي. يُنشأ مخفيًّا: نشره بلا أسئلة يعطي
 * الطالب اختبارًا فارغًا.
 */
export async function createHomework(input: {
  lessonId: string
  courseId: string
  title: string
  passingPercentage: string
  durationMinutes: string
  maxAttempts: string
}) {
  const title = input.title.trim()
  if (title.length < 3) return { ok: false, message: 'عنوان الواجب قصير جدًا.' }
  if (title.length > 150) return { ok: false, message: 'عنوان الواجب طويل جدًا.' }

  const passing = Number(input.passingPercentage || '60')
  if (!Number.isFinite(passing) || passing < 1 || passing > 100) {
    return { ok: false, message: 'نسبة النجاح من ١ إلى ١٠٠.' }
  }

  // الفارغ يعني «بلا حدّ» لا صفرًا: واجب بلا مؤقّت وبلا سقف محاولات
  const duration = input.durationMinutes.trim()
  const minutes = duration === '' ? null : Number(duration)
  if (minutes !== null && (!Number.isFinite(minutes) || minutes < 1 || minutes > 600)) {
    return { ok: false, message: 'مدة الواجب من دقيقة إلى ٦٠٠ دقيقة، أو اتركها فارغة.' }
  }

  const attemptsRaw = input.maxAttempts.trim()
  const attempts = attemptsRaw === '' ? null : Number(attemptsRaw)
  if (attempts !== null && (!Number.isFinite(attempts) || attempts < 1 || attempts > 20)) {
    return { ok: false, message: 'عدد المحاولات من ١ إلى ٢٠، أو اتركه فارغًا.' }
  }

  const ctx = await adminClient()
  if (!ctx) return { ok: false, message: messageFor('FORBIDDEN') }

  const { data, error } = await ctx.supabase
    .from('exams')
    .insert({
      lesson_id: input.lessonId,
      course_id: input.courseId,
      title,
      passing_percentage: passing,
      duration_minutes: minutes,
      max_attempts: attempts,
      is_published: false,
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, message: messageFor(toErrorCode(error)) }

  refresh(input.courseId)
  return { ok: true, message: 'أُنشئ الواجب. أضف أسئلته ثم انشره.', examId: data.id }
}

/**
 * فكّ ارتباط الواجب بالدرس.
 * لا يحذفه: يبقى اختبارًا في المقرر بمحاولاته ونتائجه.
 */
export async function detachHomework(examId: string, courseId: string) {
  const ctx = await adminClient()
  if (!ctx) return { ok: false, message: messageFor('FORBIDDEN') }

  const { error } = await ctx.supabase
    .from('exams')
    .update({ lesson_id: null })
    .eq('id', examId)

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  refresh(courseId)
  return { ok: true, message: 'فُكّ ارتباط الواجب بالدرس. ما زال اختبارًا في المقرر.' }
}

/**
 * حذف واجب.
 * المحاولات تُحذف معه (CASCADE)، فيُمنع إن حلّه طالب — كما في الدروس.
 */
export async function deleteHomework(examId: string, courseId: string) {
  const ctx = await adminClient()
  if (!ctx) return { ok: false, message: messageFor('FORBIDDEN') }

  const { count } = await ctx.supabase
    .from('exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId)

  if (count && count > 0) {
    return {
      ok: false,
      message: `حلّ هذا الواجب ${formatNumber(count)} محاولة، وحذفه يمحو نتائجها. أخفِه بدل حذفه.`,
    }
  }

  const { error } = await ctx.supabase.from('exams').delete().eq('id', examId)
  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  refresh(courseId)
  return { ok: true, message: 'حُذف الواجب.' }
}

/** نشر الواجب أو إخفاؤه — النشر يتطلّب سؤالًا واحدًا على الأقل. */
export async function setHomeworkPublished(
  examId: string,
  courseId: string,
  published: boolean,
) {
  const ctx = await adminClient()
  if (!ctx) return { ok: false, message: messageFor('FORBIDDEN') }

  if (published) {
    const { count } = await ctx.supabase
      .from('exam_questions')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', examId)

    if (!count) {
      return { ok: false, message: 'أضف سؤالًا واحدًا على الأقل قبل نشر الواجب.' }
    }
  }

  const { error } = await ctx.supabase
    .from('exams')
    .update({ is_published: published })
    .eq('id', examId)

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  refresh(courseId)
  return {
    ok: true,
    message: published ? 'نُشر الواجب. صار يظهر مع الدرس.' : 'أُخفي الواجب عن الطلاب.',
  }
}
