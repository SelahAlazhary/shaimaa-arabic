'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { Select } from '@/components/ui/field'

export function StudentsFilters({
  grades,
}: {
  grades: { id: string; name_ar: string }[]
}) {
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
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`))
  }

  // تأخير 350ms: بدونه ينطلق استعلام لكل ضغطة زر (البند 35)
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
        <label htmlFor="student-search" className="sr-only">
          ابحث عن طالب
        </label>
        <Search
          className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-ink-faint"
          aria-hidden
        />
        <input
          id="student-search"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث بالاسم أو البريد أو الهاتف…"
          className="h-11 w-full rounded-[var(--radius-field)] border border-border-strong bg-surface ps-10 pe-10 text-sm text-ink placeholder:text-ink-faint hover:border-ink-faint"
        />
        {pending && (
          <Loader2
            className="absolute inset-y-0 end-3.5 my-auto size-4 animate-spin text-ink-faint"
            aria-label="جارٍ البحث"
          />
        )}
      </div>

      <div className="flex gap-3">
        <Select
          aria-label="الحالة"
          value={params.get('status') ?? ''}
          onChange={(e) => apply({ status: e.target.value })}
          className="sm:w-36"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">موقوف</option>
        </Select>

        <Select
          aria-label="الصف الدراسي"
          value={params.get('grade') ?? ''}
          onChange={(e) => apply({ grade: e.target.value })}
          className="sm:w-48"
        >
          <option value="">كل الصفوف</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name_ar}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
