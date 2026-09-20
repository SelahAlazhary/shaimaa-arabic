'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { toErrorCode, messageFor } from '@/lib/errors'

export type RedeemState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string; courseTitle: string }

/**
 * تفعيل كود التفعيل.
 * لا منطق أعمال هنا إطلاقًا: كل الفحوص والمعاملة داخل redeem_activation_code
 * في القاعدة — تنفيذ واحد مركزي (القاعدة 4)، وذرّي ضد الطلبات المتزامنة.
 */
export async function redeemCode(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const raw = String(formData.get('code') ?? '').trim()

  if (!raw) {
    return { status: 'error', message: 'اكتب كود التفعيل أولًا.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('redeem_activation_code', { p_code: raw })

  if (error) {
    return { status: 'error', message: messageFor(toErrorCode(error)) }
  }

  const result = data as { course_title?: string } | null
  const courseTitle = result?.course_title ?? 'المقرر'

  revalidatePath('/student', 'layout')

  return {
    status: 'success',
    message: `تم فتح «${courseTitle}» على حسابك.`,
    courseTitle,
  }
}
