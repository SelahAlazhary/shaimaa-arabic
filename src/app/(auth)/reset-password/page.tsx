import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = { title: 'كلمة مرور جديدة' }

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">تعيين كلمة مرور جديدة</h1>
      <p className="mt-1.5 text-sm text-ink-muted">اختر كلمة مرور قوية لا تستخدمها في مكان آخر.</p>

      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </div>
  )
}
