'use client'

import { useEffect, useState } from 'react'
import { NAV_LINKS } from '@/lib/site/content'
import { cn } from '@/lib/utils/cn'

/**
 * الرابط النشط يُحدَّد بالقسم الظاهر فعلًا على الشاشة لا بالقسم الأول دائمًا،
 * وإلا كان الخط الذهبي يدّعي موضعًا لا يطابق ما يقرأه الزائر.
 */
function useActiveSection() {
  const [active, setActive] = useState<string>(NAV_LINKS[0].href)

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(
      (el): el is Element => Boolean(el),
    )
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) setActive(`#${visible.target.id}`)
      },
      // الشريط العلوي يغطّي ٥rem، والقسم يُعدّ نشطًا حين يملأ وسط الشاشة
      { rootMargin: '-20% 0px -60% 0px', threshold: [0.01, 0.25, 0.5] },
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return active
}

export function NavigationLinks({
  orientation = 'horizontal',
  onNavigate,
}: {
  orientation?: 'horizontal' | 'vertical'
  onNavigate?: () => void
}) {
  const active = useActiveSection()
  const vertical = orientation === 'vertical'

  return (
    <ul className={cn('flex items-center', vertical ? 'flex-col items-stretch gap-1' : 'gap-1')}>
      {NAV_LINKS.map((item) => {
        const isActive = active === item.href
        return (
          <li key={item.href}>
            <a
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'relative block rounded-[var(--radius-field)] px-3.5 text-sm transition-colors',
                vertical ? 'py-3' : 'py-2',
                isActive
                  ? 'font-medium text-ink-invert'
                  : 'text-brand-100 hover:text-ink-invert',
                // الخط الذهبي أسفل الرابط النشط — أفقيًا فقط كما في التصميم
                !vertical &&
                  isActive &&
                  'after:absolute after:inset-x-3.5 after:-bottom-2 after:h-0.5 after:rounded-full after:bg-accent',
                vertical && isActive && 'bg-brand-700',
              )}
            >
              {item.label}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
