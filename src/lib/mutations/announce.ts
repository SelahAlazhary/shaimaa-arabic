'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { messageFor, toErrorCode } from '@/lib/errors'
import { formatNumber } from '@/lib/utils/format'
import { optionalUuidField } from '@/lib/validations/shared'

export type AnnounceState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> }
  | { status: 'success'; message: string }

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '')

const schema = z.object({
  title: z.string({ error: 'العنوان مطلوب' }).trim().min(3, 'العنوان قصير جدًا').max(120, 'العنوان طويل جدًا'),
  body: z.string().trim().max(500, 'النص طويل جدًا').optional().or(z.literal('')),
  link: z.string().trim().max(200, 'الرابط طويل جدًا').optional().or(z.literal('')),
  audience: z.enum(['all', 'grade', 'course'], { error: 'اختر الفئة' }),
  gradeId: optionalUuidField('اختر الصف'),
  courseId: optionalUuidField('اختر المقرر'),
})

/**
 * إشعار يكتبه المدير ويصل إلى صندوق الطلاب داخل المنصة.
 *
 * الإشعارات التلقائية (تفعيل كود، فتح مقرر) تكتبها القاعدة؛ هذه هي
 * الرسالة اليدوية التي كانت الشاشة تعرضها ولا تتيح إرسالها.
 */
export async function sendAnnouncement(
  _prev: AnnounceState,
  formData: FormData,
): Promise<AnnounceState> {
  const parsed = schema.safeParse({
    title: text(formData, 'title'),
    body: text(formData, 'body'),
    link: text(formData, 'link'),
    audience: text(formData, 'audience'),
    gradeId: text(formData, 'gradeId'),
    courseId: text(formData, 'courseId'),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { status: 'error', message: 'راجع البيانات المدخلة.', fieldErrors }
  }

  const v = parsed.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: messageFor('UNAUTHORIZED') }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return { status: 'error', message: messageFor('FORBIDDEN') }
  }

  // من يستقبل: كل الطلاب النشطين، أو صفّ بعينه، أو مشتركو مقرر
  let recipients: string[] = []

  if (v.audience === 'course') {
    if (!v.courseId) return { status: 'error', message: 'اختر المقرر أولًا.' }
    const { data } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', v.courseId)
      .eq('status', 'active')
    recipients = [...new Set((data ?? []).map((r) => r.student_id))]
  } else {
    let query = supabase.from('profiles').select('id').eq('role', 'student').eq('status', 'active')
    if (v.audience === 'grade') {
      if (!v.gradeId) return { status: 'error', message: 'اختر الصف أولًا.' }
      query = query.eq('grade_id', v.gradeId)
    }
    const { data } = await query
    recipients = (data ?? []).map((r) => r.id)
  }

  if (recipients.length === 0) {
    return { status: 'error', message: 'لا يوجد طالب في هذه الفئة الآن.' }
  }

  const { error } = await supabase.from('notifications').insert(
    recipients.map((id) => ({
      user_id: id,
      title: v.title,
      body: v.body || null,
      link: v.link || null,
    })),
  )

  if (error) return { status: 'error', message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/notifications')
  revalidatePath('/student', 'layout')

  return {
    status: 'success',
    message: `أُرسل الإشعار إلى ${formatNumber(recipients.length)} طالبًا.`,
  }
}
