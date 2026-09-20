'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { messageFor, toErrorCode } from '@/lib/errors'
import { TEXT_KEYS, DEFAULT_TEXTS } from '@/lib/site/texts'
import { formatNumber } from '@/lib/utils/format'

export type TextsState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

const MAX_LEN = 600

/**
 * حفظ نصوص الصفحة العامة.
 *
 * تُقبل المفاتيح المعروفة وحدها: النموذج يُبنى من السجلّ، فأي مفتاح غريب
 * في الطلب تلاعبٌ لا خطأ. وما ساوى الأصل لا يُحفَظ، فيبقى الجدول صغيرًا
 * ويظلّ تغيير النصّ الافتراضي في الكود ساريًا على ما لم يُخصَّص.
 */
export async function saveSiteTexts(
  _prev: TextsState,
  formData: FormData,
): Promise<TextsState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: messageFor('UNAUTHORIZED') }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return { status: 'error', message: messageFor('FORBIDDEN') }
  }

  const next: Record<string, string> = {}

  for (const key of TEXT_KEYS) {
    const raw = formData.get(key)
    if (typeof raw !== 'string') continue

    const value = raw.trim().slice(0, MAX_LEN)
    if (!value) continue
    if (value === DEFAULT_TEXTS[key]) continue

    next[key] = value
  }

  const { error } = await supabase
    .from('platform_settings')
    .update({ value: next, updated_by: user.id })
    .eq('key', 'site_texts')

  if (error) return { status: 'error', message: messageFor(toErrorCode(error)) }

  // الصفحة العامة مبنيّة مسبقًا (revalidate = 3600)، فلا بدّ من إبطالها
  revalidatePath('/')
  revalidatePath('/admin/settings')

  const changed = Object.keys(next).length
  return {
    status: 'success',
    message: changed
      ? `تم الحفظ. ${formatNumber(changed)} نصًّا مخصَّصًا، والباقي على أصله.`
      : 'تم الحفظ. كل النصوص عادت إلى أصلها.',
  }
}
