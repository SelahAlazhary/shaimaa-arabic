import { z } from 'zod'
import { uuidField, optionalUuidField } from '@/lib/validations/shared'

/** مخططات محتوى المنصة. الرسائل عربية صريحة — لا رسالة Zod افتراضية تصل للمستخدم. */

const title = z
  .string({ error: 'العنوان مطلوب' })
  .trim()
  .min(3, 'العنوان قصير جدًا')
  .max(120, 'العنوان طويل جدًا')

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(''))

export const COURSE_STATUSES = [
  { value: 'draft', label: 'مسودّة', hint: 'لا يراه الطلاب' },
  { value: 'published', label: 'منشور', hint: 'متاح للطلاب' },
  { value: 'archived', label: 'مؤرشف', hint: 'مخفي، والمشتركون يحتفظون بوصولهم' },
] as const

export const courseSchema = z.object({
  title,
  description: optionalText(2000, 'الوصف طويل جدًا'),
  gradeId: optionalUuidField('اختر صفًا صحيحًا'),
  price: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'السعر رقم موجب')
    .or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived'], { error: 'اختر حالة المقرر' }),
  // فارغ يعني «ولّده تلقائيًا»
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'حروف إنجليزية صغيرة وأرقام وشرطات فقط')
    .max(60, 'المعرّف طويل جدًا')
    .or(z.literal('')),
})

export const moduleSchema = z.object({
  courseId: uuidField('مقرر غير صحيح'),
  title,
})

export const lessonSchema = z.object({
  courseId: uuidField('مقرر غير صحيح'),
  moduleId: optionalUuidField('وحدة غير صحيحة'),
  title,
  description: optionalText(2000, 'الشرح طويل جدًا'),
  videoUrl: z
    .string()
    .trim()
    .url('رابط غير صحيح — لازم يبدأ بـ https://')
    .max(500, 'الرابط طويل جدًا')
    .or(z.literal('')),
  durationMinutes: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, 'المدة بالدقائق، رقم من ٠ إلى ٩٩٩')
    .or(z.literal('')),
  isFree: z.union([z.literal('on'), z.literal('')]).optional(),
  isPublished: z.union([z.literal('on'), z.literal('')]).optional(),
})

export const liveSchema = z.object({
  courseId: optionalUuidField('اختر المقرر'),
  title,
  description: optionalText(1000, 'الوصف طويل جدًا'),
  streamUrl: z.string().trim().url('رابط غير صحيح').max(500).or(z.literal('')),
  recordingUrl: z.string().trim().url('رابط غير صحيح').max(500).or(z.literal('')),
  startsAt: z.string().trim().min(1, 'حدّد موعد الحصة'),
  status: z.enum(['scheduled', 'live', 'ended', 'cancelled'], { error: 'اختر الحالة' }),
})

export type CourseInput = z.infer<typeof courseSchema>
export type LessonInput = z.infer<typeof lessonSchema>
export type LiveInput = z.infer<typeof liveSchema>

/**
 * معرّف الرابط: العناوين عربية والقيد في القاعدة يقبل الحروف اللاتينية فقط،
 * فلا سبيل لاشتقاقه من العنوان. يُولَّد قصيرًا وفريدًا، ويستطيع المدير تغييره.
 */
export function generateSlug(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return `c-${out}`
}
