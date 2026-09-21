'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { toErrorCode, messageFor } from '@/lib/errors'
import { pluralAr } from '@/lib/utils/format'

export type GenerateState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string; codes: string[] }

/**
 * توليد أكواد بالجملة.
 * الحدود والصلاحية مفروضة داخل generate_activation_codes في القاعدة؛
 * الفحص هنا لتجربة المستخدم فقط ولا يُعتمد عليه أمنيًا (البند 27).
 */
export async function generateCodes(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const courseId = String(formData.get('courseId') ?? '')
  const quantity = Number(formData.get('quantity') ?? '0')
  const grantsDays = String(formData.get('grantsDays') ?? '').trim()
  const batch = String(formData.get('batch') ?? '').trim()

  if (!courseId) return { status: 'error', message: 'اختر المقرر أولًا.' }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { status: 'error', message: 'أدخل عددًا صحيحًا أكبر من صفر.' }
  }
  if (quantity > 500) {
    return { status: 'error', message: 'الحد الأقصى ٥٠٠ كود في الدفعة الواحدة.' }
  }

  const days = grantsDays ? Number(grantsDays) : null
  if (days !== null && (!Number.isInteger(days) || days <= 0)) {
    return { status: 'error', message: 'مدة الاشتراك بالأيام لازم تكون رقمًا أكبر من صفر.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('generate_activation_codes', {
    p_course: courseId,
    p_quantity: quantity,
    // الدالة تقبل غياب الوسيط لا قيمة null: الغياب يعني "بلا نهاية"
    ...(days !== null ? { p_grants_days: days } : {}),
    ...(batch ? { p_batch: batch } : {}),
  })

  if (error) {
    return { status: 'error', message: messageFor(toErrorCode(error)) }
  }

  const codes = ((data ?? []) as { code: string }[]).map((r) => r.code)
  revalidatePath('/admin/codes')

  return {
    status: 'success',
    message: `تم توليد ${pluralAr(codes.length, {
      one: 'كود واحد',
      two: 'كودين',
      few: 'أكواد',
      many: 'كودًا',
    })} بنجاح.`,
    codes,
  }
}
