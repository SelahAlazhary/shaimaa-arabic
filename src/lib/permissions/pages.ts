/**
 * صفحات لوحة الإدارة كوحدة صلاحية.
 *
 * المفتاح ليس زينةً في الواجهة: القاعدة تقرؤه في `profiles.allowed_pages`
 * وتبني عليه سياسات الكتابة عبر `private.admin_can(...)`. أي مفتاح يُضاف هنا
 * يحتاج ما يقابله في تلك السياسات، وإلّا بقي حجبًا في الشاشة بلا أثر.
 */
export const ADMIN_PAGES = [
  { key: 'students', label: 'الطلاب', href: '/admin/students', hint: 'الحسابات والاشتراكات اليدوية' },
  { key: 'courses', label: 'المقررات', href: '/admin/courses', hint: 'الوحدات والدروس والفيديو' },
  { key: 'codes', label: 'أكواد التفعيل', href: '/admin/codes', hint: 'توليد الأكواد وإلغاؤها' },
  { key: 'support', label: 'الدعم', href: '/admin/support', hint: 'محادثات الطلاب' },
  { key: 'grades', label: 'الصفوف', href: '/admin/grades', hint: 'المراحل والصفوف' },
  { key: 'attachments', label: 'المرفقات', href: '/admin/attachments', hint: 'الملفات والملازم' },
  { key: 'exams', label: 'الاختبارات', href: '/admin/exams', hint: 'الأسئلة والنتائج' },
  { key: 'live', label: 'البث المباشر', href: '/admin/live', hint: 'جدولة الحصص المباشرة' },
  { key: 'notifications', label: 'الإشعارات', href: '/admin/notifications', hint: 'الرسائل المرسلة للطلاب' },
  { key: 'analytics', label: 'التحليلات', href: '/admin/analytics', hint: 'أرقام المنصة' },
  { key: 'settings', label: 'الإعدادات', href: '/admin/settings', hint: 'المنصة والمشرفون وسجلّ التدقيق' },
] as const

export type AdminPageKey = (typeof ADMIN_PAGES)[number]['key']

export const ADMIN_PAGE_KEYS: readonly string[] = ADMIN_PAGES.map((p) => p.key)

const LABELS = new Map(ADMIN_PAGES.map((p) => [p.key, p.label] as const))

export const labelOfPage = (key: string): string => LABELS.get(key as AdminPageKey) ?? key

/**
 * صفحة «نظرة عامة» لا تُحجب: هي وجهة الردّ حين يُمنع المدير من غيرها،
 * وحجبها يترك حسابًا يدخل ولا يجد شيئًا.
 */
export const ADMIN_HOME = '/admin'

/** هل يفتح هذا المدير هذه الصفحة؟ قائمة فارغة (null) تعني الكل. */
export function canOpenPage(
  allowed: string[] | null,
  isSuper: boolean,
  key: AdminPageKey,
): boolean {
  if (isSuper || allowed === null) return true
  return allowed.includes(key)
}
