import { z } from 'zod'
import { uuidField } from '@/lib/validations/shared'

/**
 * مخططات التحقق على مستوى التطبيق (البند 9).
 * القاعدة تفرض نفس القيود عبر CHECK constraints — الطبقتان معًا لا إحداهما.
 * كل رسالة مكتوبة بالعربية صراحةً: رسالة Zod الافتراضية إنجليزية ولا تصل للمستخدم أبدًا.
 */

const email = z
  .string({ error: 'البريد الإلكتروني مطلوب' })
  .trim()
  .min(1, 'البريد الإلكتروني مطلوب')
  .email('صيغة البريد الإلكتروني غير صحيحة')
  .toLowerCase()

const password = z
  .string({ error: 'كلمة المرور مطلوبة' })
  .min(8, 'كلمة المرور ٨ أحرف على الأقل')
  .max(72, 'كلمة المرور طويلة جدًا')

// نفس القيد الموجود في profiles_phone_format داخل القاعدة: ١١ رقمًا تبدأ بـ01.
// الحقل في الواجهة يقبل الأرقام فقط ويقف عند ١١، لكن التحقق هنا إلزامي
// لأن الواجهة قابلة للتجاوز.
export const PHONE_LENGTH = 11

const phone = z
  .string({ error: 'رقم الموبايل مطلوب' })
  .trim()
  .regex(/^01[0125][0-9]{8}$/, 'رقم موبايل مصري غير صحيح — ١١ رقمًا تبدأ بـ ٠١')

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'كلمة المرور مطلوبة' }).min(1, 'كلمة المرور مطلوبة'),
})

export const SECTIONS = [
  { value: 'scientific', label: 'علمي' },
  { value: 'literary', label: 'أدبي' },
] as const

export const registerSchema = z
  .object({
    fullName: z
      .string({ error: 'الاسم مطلوب' })
      .trim()
      .min(3, 'اكتب الاسم كاملًا')
      .max(80, 'الاسم طويل جدًا')
      .regex(/^[؀-ۿ\s'-]+$/u, 'اكتب الاسم بالعربية'),
    email,
    phone,
    stageId: uuidField('اختر المرحلة الدراسية'),
    gradeId: uuidField('اختر الصف الدراسي'),
    governorateId: uuidField('اختر المحافظة'),
    // فارغ مسموح هنا، والتحقّق المشروط أدناه يفرضه على الثانوي فقط
    section: z.enum(['scientific', 'literary']).or(z.literal('')),
    schoolName: z
      .string({ error: 'اسم المدرسة مطلوب' })
      .trim()
      .min(2, 'اكتب اسم المدرسة')
      .max(120, 'اسم المدرسة طويل جدًا'),
    // اسم المرحلة يُمرَّر من الواجهة لتحديد إلزامية الشعبة بلا استعلام إضافي
    stageRequiresSection: z.union([z.literal('yes'), z.literal('no'), z.literal('')]).optional(),
    password,
    confirmPassword: z.string({ error: 'أعد كتابة كلمة المرور' }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  })
  // الشُّعبة للثانوي فقط: الإعدادي ليس فيه علمي وأدبي
  .refine((v) => v.stageRequiresSection !== 'yes' || v.section !== '', {
    message: 'اختر الشعبة: علمي أو أدبي',
    path: ['section'],
  })

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string({ error: 'أعد كتابة كلمة المرور' }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
