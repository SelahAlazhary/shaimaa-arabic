'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { messageFor, toErrorCode } from '@/lib/errors'

/**
 * المراحل والصفوف: ما يراه الطالب في نموذج التسجيل.
 * الإخفاء لا الحذف هو الأصل — صفٌّ فيه طلاب حذفُه يقطع انتماءهم.
 */
async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) return null
  return supabase
}

const refresh = () => {
  revalidatePath('/admin/grades')
  revalidatePath('/register')
  revalidatePath('/')
}

export async function addStage(name: string) {
  const title = name.trim()
  if (title.length < 3) return { ok: false, message: 'اسم المرحلة قصير جدًا.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { count } = await supabase
    .from('education_stages')
    .select('id', { count: 'exact', head: true })

  const { error } = await supabase
    .from('education_stages')
    .insert({ name_ar: title, sort_order: (count ?? 0) + 1 })

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }
  refresh()
  return { ok: true, message: 'أُضيفت المرحلة.' }
}

export async function addGrade(stageId: string, name: string) {
  const title = name.trim()
  if (title.length < 3) return { ok: false, message: 'اسم الصف قصير جدًا.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { count } = await supabase
    .from('grades')
    .select('id', { count: 'exact', head: true })
    .eq('stage_id', stageId)

  const { error } = await supabase
    .from('grades')
    .insert({ stage_id: stageId, name_ar: title, sort_order: (count ?? 0) + 1 })

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }
  refresh()
  return { ok: true, message: 'أُضيف الصف.' }
}

export async function renameGrade(gradeId: string, name: string) {
  const title = name.trim()
  if (title.length < 3) return { ok: false, message: 'اسم الصف قصير جدًا.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { error } = await supabase.from('grades').update({ name_ar: title }).eq('id', gradeId)
  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }
  refresh()
  return { ok: true, message: 'تم تغيير الاسم.' }
}

/** الإخفاء يمنع ظهوره للطالب الجديد ولا يمسّ من اختاره من قبل. */
export async function toggleGradeVisible(gradeId: string, next: boolean) {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { error } = await supabase.from('grades').update({ is_visible: next }).eq('id', gradeId)
  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }
  refresh()
  return { ok: true, message: next ? 'صار الصف ظاهرًا للطلاب.' : 'أُخفي الصف عن نموذج التسجيل.' }
}

export async function toggleStageVisible(stageId: string, next: boolean) {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { error } = await supabase
    .from('education_stages')
    .update({ is_visible: next })
    .eq('id', stageId)

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }
  refresh()
  return { ok: true, message: next ? 'صارت المرحلة ظاهرة.' : 'أُخفيت المرحلة عن نموذج التسجيل.' }
}
