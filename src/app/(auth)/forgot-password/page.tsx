import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = { title: 'استعادة كلمة المرور' }

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">استعادة كلمة المرور</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        اكتب بريدك الإلكتروني وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.
      </p>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        تذكّرتها؟{' '}
        <Link href="/login" className="font-medium text-brand-600 underline-offset-4 hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </div>
  )
}
