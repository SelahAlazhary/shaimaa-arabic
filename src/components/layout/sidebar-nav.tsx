'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  BookOpen,
  TrendingUp,
  ClipboardList,
  Radio,
  LifeBuoy,
  User,
  Users,
  GraduationCap,
  FileText,
  Ticket,
  Bell,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type NavArea = 'student' | 'admin' | 'support'
type NavItem = { href: string; label: string; icon: LucideIcon }

/**
 * التنقّل مُعرَّف هنا لا في تخطيط الخادم.
 * السبب تقني لا تنظيمي: مكوّنات أيقونات Lucide دوال، وReact لا يستطيع
 * تمرير الدوال من Server Component إلى Client Component — تُسلسَل فتنكسر.
 * الخادم يمرّر اسم المنطقة فقط، والعميل يختار أيقوناته بنفسه.
 *
 * الخمسة الأولى في كل قائمة هي شريط الموبايل السفلي (البند 30).
 */
const NAV: Record<NavArea, NavItem[]> = {
  student: [
    { href: '/student', label: 'الرئيسية', icon: LayoutGrid },
    { href: '/student/courses', label: 'كورساتي', icon: BookOpen },
    { href: '/student/progress', label: 'تقدّمي', icon: TrendingUp },
    { href: '/student/exams', label: 'الاختبارات', icon: ClipboardList },
    { href: '/student/profile', label: 'حسابي', icon: User },
    { href: '/student/live', label: 'البث المباشر', icon: Radio },
    { href: '/student/support', label: 'المساعدة', icon: LifeBuoy },
  ],
  admin: [
    { href: '/admin', label: 'نظرة عامة', icon: LayoutGrid },
    { href: '/admin/students', label: 'الطلاب', icon: Users },
    { href: '/admin/courses', label: 'الكورسات', icon: BookOpen },
    { href: '/admin/codes', label: 'أكواد التفعيل', icon: Ticket },
    { href: '/admin/support', label: 'الدعم', icon: LifeBuoy },
    { href: '/admin/grades', label: 'الصفوف', icon: GraduationCap },
    { href: '/admin/attachments', label: 'المرفقات', icon: FileText },
    { href: '/admin/exams', label: 'الاختبارات', icon: ClipboardList },
    { href: '/admin/live', label: 'البث المباشر', icon: Radio },
    { href: '/admin/notifications', label: 'الإشعارات', icon: Bell },
    { href: '/admin/analytics', label: 'التحليلات', icon: BarChart3 },
    { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
  ],
  support: [
    { href: '/support', label: 'التذاكر', icon: LifeBuoy },
    { href: '/support/profile', label: 'حسابي', icon: User },
  ],
}

/** الجذر يُطابَق تمامًا، وما تحته بالبادئة — وإلا بقي الجذر نشطًا دائمًا. */
function isActive(pathname: string, href: string, roots: string[]): boolean {
  if (pathname === href) return true
  if (roots.includes(href)) return false
  return pathname.startsWith(`${href}/`)
}

const ROOTS = ['/student', '/admin', '/support']

/**
 * العنصر النشط يُعلَن بـaria-current لا باللون وحده —
 * الاعتماد على اللون فقط يُسقط من لا يميّزه (البند 22).
 */
export function SidebarNav({ area }: { area: NavArea }) {
  const pathname = usePathname()

  return (
    <nav aria-label="القائمة الرئيسية" className="px-3">
      <p className="px-3 pb-2 text-sm font-medium text-ink-faint">القائمة</p>
      <ul className="space-y-1">
        {NAV[area].map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href, ROOTS)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--radius-field)] px-3 py-2.5 text-base transition-colors',
                  active
                    ? 'bg-brand-700 font-medium text-ink-invert'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                )}
              >
                <Icon className="size-[1.125rem] shrink-0" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function MobileNav({ area }: { area: NavArea }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="التنقّل السريع"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV[area].slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href, ROOTS)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'tap-target flex flex-col items-center justify-center gap-1 py-2 text-[0.6875rem]',
                  active ? 'font-medium text-brand-700' : 'text-ink-faint',
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
