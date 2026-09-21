'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { messageFor } from '@/lib/errors'

export type StaffState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> }
  | { status: 'success'; message: string }

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '')

const passwordField = z
  .string({ error: 'كلمة المرور مطلوبة' })
  .min(10, 'كلمة المرور ١٠ أحرف على الأقل')
  .max(72, 'كلمة المرور طويلة جدًا')
  .regex(/[A-Za-z\u0600-\u06FF]/, 'أضف حرفًا واحدًا على الأقل')
  .regex(/[0-9]/, 'أضف رقمًا واحدًا على الأقل')

const staffSchema = z.object({
  fullName: z
    .string({ error: 'الاسم مطلوب' })
    .trim()
    .min(3, 'الاسم قصير جدًا')
    .max(120, 'الاسم طويل جدًا'),
  email: z.email({ error: 'بريد إلكتروني غير صحيح' }).trim().toLowerCase(),
  password: passwordField,
  role: z.enum(['support', 'admin'], { error: 'اختر الصلاحية' }),
})

/**
 * رسائل الدالة في القاعدة رموزٌ لا نصوص: القاعدة تعرف السبب،
 * والعربية تُكتب هنا في مكان واحد مع بقية رسائل الواجهة.
 */
const DB_ERRORS: Record<string, string> = {
  ONLY_SUPER_ADMIN: 'ترقية حساب إلى «مدير» تتطلّب حساب مدير عام.',
  FORBIDDEN: 'ليست لديك صلاحية لهذا الإجراء.',
  BAD_ROLE: 'الصلاحية المطلوبة غير معروفة.',
  BAD_NAME: 'الاسم قصير جدًا.',
  BAD_EMAIL: 'بريد إلكتروني غير صحيح.',
  EMAIL_TAKEN: 'هذا البريد مسجَّل بالفعل على المنصة.',
  WEAK_PASSWORD: 'كلمة المرور ١٠ أحرف على الأقل، وفيها حرف ورقم.',
  SELF_NOT_ALLOWED: 'غيّر كلمة مرورك من صفحة حسابك لا من هنا.',
  NOT_FOUND: 'لم نعثر على هذا الحساب.',
}

const readDbError = (message: string) => {
  for (const [code, arabic] of Object.entries(DB_ERRORS)) {
    if (message.includes(code)) return arabic
  }
  return messageFor('UNKNOWN')
}

export async function createStaffAccount(
  _prev: StaffState,
  formData: FormData,
): Promise<StaffState> {
  const parsed = staffSchema.safeParse({
    fullName: text(formData, 'fullName'),
    email: text(formData, 'email'),
    password: text(formData, 'password'),
    role: text(formData, 'role'),
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

  // الصلاحية تُفرَض داخل الدالة نفسها؛ هذا نداء لا حارس
  const { error } = await supabase.rpc('create_staff_account', {
    p_email: v.email,
    p_password: v.password,
    p_full_name: v.fullName,
    p_role: v.role,
  })

  if (error) return { status: 'error', message: readDbError(error.message) }

  revalidatePath('/admin/settings')
  revalidatePath('/admin/students')

  const label = v.role === 'admin' ? 'مدير' : 'فريق الدعم'
  return { status: 'success', message: `أُنشئ حساب ${v.fullName} بصلاحية ${label}.` }
}

/** إعادة تعيين كلمة مرور حساب — الطالب يطلبها من الدعم. */
export async function resetAccountPassword(userId: string, password: string) {
  const check = passwordField.safeParse(password)
  if (!check.success) {
    return { ok: false, message: check.error.issues[0]?.message ?? 'كلمة مرور غير صالحة.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('set_account_password', {
    p_user: userId,
    p_password: password,
  })

  if (error) return { ok: false, message: readDbError(error.message) }

  revalidatePath('/admin/students')
  return { ok: true, message: 'تم تعيين كلمة المرور. سلّمها للطالب.' }
}
