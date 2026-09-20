import type { Metadata } from 'next'
import { ShieldAlert } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'

export const metadata: Metadata = { title: 'الحساب موقوف' }

export default function SuspendedPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-md rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-8 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-warning-bg text-warning">
          <ShieldAlert className="size-6" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold text-ink">حسابك موقوف مؤقتًا</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          لا يمكنك استخدام المنصة حاليًا. تواصل مع الدعم لمعرفة السبب وكيفية إعادة التفعيل.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}
