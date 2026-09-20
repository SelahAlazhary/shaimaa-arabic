'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { NavigationLinks } from '@/components/site/navigation-links'
import { AuthButtons } from '@/components/site/cta-buttons'
import { MENU } from '@/lib/site/content'

export function Navbar({ name, tagline }: { name: string; tagline: string }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // القائمة المفتوحة تُغلق بـEsc وبالنقر خارجها — سلوك متوقَّع لا إضافة
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 bg-brand-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:h-20">
        <Logo name={name} tagline={tagline} />

        <nav aria-label="أقسام الصفحة" className="hidden lg:block">
          <NavigationLinks />
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <AuthButtons />
          </div>

          {/* زرّ القائمة يظهر دون lg: الروابط تنتقل إلى لوحة منسدلة */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? MENU.close : MENU.open}
            className="grid size-11 place-items-center rounded-[var(--radius-field)] border border-accent-soft/60 text-ink-invert transition-colors hover:bg-brand-700 lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={panelRef}
          id="site-menu"
          className="border-t border-brand-700 bg-brand-800 lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
            <nav aria-label="أقسام الصفحة">
              <NavigationLinks orientation="vertical" onNavigate={() => setOpen(false)} />
            </nav>

            {/* الزرّان نصًّا كاملًا هنا: اللوحة تتّسع لهما، والأيقونة وحدها أقلّ وضوحًا */}
            <div className="mt-4 flex flex-col gap-2 border-t border-brand-700 pt-4 sm:hidden">
              <AuthButtons block />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
