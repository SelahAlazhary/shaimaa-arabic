'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, Search } from 'lucide-react'
import { setUserRole } from '@/lib/mutations/auth'
import { Button } from '@/components/ui/button'
import { Badge, EmptyState } from '@/components/ui/card'

type Row = { id: string; fullName: string; email: string; role: string }

const ROLE_LABEL: Record<string, string> = {
  student: 'طالب',
  support: 'فريق الدعم',
  admin: 'مدير',
  super_admin: 'مدير عام',
}

/** ماذا يملك كل دور — يُعرَض للمدير قبل أن يختار، لا بعد. */
const ROLE_SCOPE: Record<string, string> = {
  support: 'يقرأ الطلاب والمقررات، ويردّ على محادثات الدعم. لا يُنشئ مقررًا ولا يولّد أكوادًا ولا يحذف.',
  admin: 'صلاحية كاملة على المحتوى والطلاب والأكواد. لا يستطيع ترقية مديرين.',
  student: 'حساب طالب عادي.',
}

export function RoleManager({ people }: { people: Row[] }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [, start] = useTransition()

  const assign = (id: string, role: 'student' | 'support' | 'admin') => {
    setBusy(id)
    start(async () => {
      const res = await setUserRole(id, role)
      setBusy(null)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  const term = q.trim()
  const shown = term
    ? people.filter((p) => p.fullName.includes(term) || p.email.includes(term))
    : people.filter((p) => p.role !== 'student')

  return (
    <div className="p-5">
      <p className="mb-4 text-base leading-[1.9] text-ink-muted">
        عيّن لحساب قائم دور «فريق الدعم» ليساعدك في الردّ على الطلاب دون صلاحية
        على المحتوى. ترقية حساب إلى «مدير» تتطلّب حساب مدير عام.
      </p>

      <label className="mb-4 flex h-12 items-center gap-2.5 rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5">
        <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
        <span className="sr-only">ابحث عن حساب</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالاسم أو البريد لتعيين دور…"
          className="h-full w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
        />
      </label>

      {shown.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={term ? 'لا نتائج مطابقة' : 'لا حسابات بصلاحيات بعد'}
          description={
            term
              ? 'جرّب اسمًا أو بريدًا آخر.'
              : 'ابحث عن حساب طالب بالأعلى لتعيّن له دور فريق الدعم.'
          }
        />
      ) : (
        <ul className="divide-y divide-border-subtle rounded-[var(--radius-card)] border border-border-subtle">
          {shown.slice(0, 12).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="min-w-0">
                <span className="block truncate text-base font-medium text-ink">{p.fullName}</span>
                <span className="block truncate text-sm text-ink-faint" dir="ltr">
                  {p.email}
                </span>
                <span className="mt-1.5 block text-sm text-ink-muted">
                  {ROLE_SCOPE[p.role] ?? 'صلاحية كاملة بما فيها ترقية المديرين.'}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-2">
                <Badge tone={p.role === 'student' ? 'neutral' : 'info'}>
                  {ROLE_LABEL[p.role] ?? p.role}
                </Badge>

                {p.role !== 'super_admin' && (
                  <>
                    {p.role !== 'support' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy === p.id}
                        onClick={() => assign(p.id, 'support')}
                      >
                        اجعله دعمًا
                      </Button>
                    )}
                    {p.role !== 'student' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === p.id}
                        onClick={() => assign(p.id, 'student')}
                      >
                        اسحب الصلاحية
                      </Button>
                    )}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
