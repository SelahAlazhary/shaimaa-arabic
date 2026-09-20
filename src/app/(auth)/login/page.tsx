import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description: 'ادخل إلى حسابك لمتابعة مقرراتك واختباراتك.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>
}) {
  const params = await searchParams

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">تسجيل الدخول</h1>
      <p className="mt-1.5 text-base text-ink-muted">أدخل بريدك وكلمة المرور للمتابعة.</p>

      {params.reset === 'done' && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-[var(--radius-card)] bg-success-bg p-3.5 text-base text-success"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>تم تغيير كلمة المرور. سجّل الدخول بها الآن.</span>
        </div>
      )}

      <div className="mt-6">
        <LoginForm next={params.next} />
      </div>

      <p className="mt-6 text-center text-base text-ink-muted">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-medium text-brand-600 underline-offset-4 hover:underline">
          أنشئ حسابًا جديدًا
        </Link>
      </p>
    </div>
  )
}
