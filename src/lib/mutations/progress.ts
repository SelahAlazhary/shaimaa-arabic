'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * حفظ تقدّم الدرس.
 * لا نثق بالنسبة القادمة من المتصفح: تُقصّ بين ٠ و١٠٠ هنا، والقاعدة تفرض
 * نفس المدى بقيد CHECK كطبقة أخيرة. وRLS تمنع الكتابة على تقدّم طالب آخر.
 */
export async function saveLessonProgress(input: {
  lessonId: string
  watchedSeconds: number
  progressPercent: number
}): Promise<{ ok: boolean }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const percent = Math.max(0, Math.min(100, Math.round(input.progressPercent)))
  const watched = Math.max(0, Math.round(input.watchedSeconds))
  // يُعدّ مكتملًا عند ٩٠٪: نهاية الفيديو غالبًا شكر وخاتمة
  const completed = percent >= 90

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      student_id: user.id,
      lesson_id: input.lessonId,
      watched_seconds: watched,
      progress_percent: percent,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,lesson_id' },
  )

  if (error) return { ok: false }

  if (completed) revalidatePath('/student', 'layout')
  return { ok: true }
}

/** تعليم الدرس مكتملًا يدويًا — للدروس بلا فيديو أو حين يُنهي الطالب مبكرًا. */
export async function markLessonComplete(lessonId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      student_id: user.id,
      lesson_id: lessonId,
      progress_percent: 100,
      completed: true,
      completed_at: new Date().toISOString(),
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,lesson_id' },
  )

  if (error) return { ok: false }

  revalidatePath('/student', 'layout')
  return { ok: true }
}
