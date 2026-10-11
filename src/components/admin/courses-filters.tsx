'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { Select } from '@/components/ui/field'

/** بحث بالعنوان وفلتر الحالة لقائمة الكورسات. نفس أسلوب فلاتر الطلاب. */
export function CoursesFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [term, setTerm] = useState(params.get('q') ?? '')
  const [pending, startTransition] = useTransition()
  const first = useRef(true)

  const apply = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    sp.delete('page') // أي فلترة جديدة تُرجعنا للصفحة الأولى
    const qs = sp.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  // تأخير 350ms: بدونه ينطلق استعلام لكل ضغطة زر
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const id = setTimeout(() => apply({ q: term }), 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  return (
    <div className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row">
      <div className="relative flex-1">
        <label htmlFor="course-search" className="sr-only">
          ابحث عن كورس
        </label>
        <Search
          className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-ink-faint"
          aria-hidden
        />
        <input
          id="course-search"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن كورس بالعنوان…"
          className="h-11 w-full rounded-[var(--radius-field)] border border-border-strong bg-surface ps-10 pe-10 text-base text-ink placeholder:text-ink-faint hover:border-ink-faint"
        />
        {pending && (
          <Loader2
            className="absolute inset-y-0 end-3.5 my-auto size-4 animate-spin text-ink-faint"
            aria-label="جارٍ البحث"
          />
        )}
      </div>

      <Select
        aria-label="الحالة"
        value={params.get('status') ?? ''}
        onChange={(e) => apply({ status: e.target.value })}
        className="sm:w-44"
      >
        <option value="">كل الحالات</option>
        <option value="published">منشور</option>
        <option value="draft">مسودّة</option>
        <option value="archived">مؤرشف</option>
      </Select>
    </div>
  )
}
