import type { Metadata } from 'next'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'تم إرسال الرابط' }

export default function ResetSentPage() {
  return (
    <div className="text-center">
      <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-success-bg text-success">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold text-ink">تحقّق من بريدك</h1>
      <p className="mt-2 text-base leading-relaxed text-ink-muted">
        إن كان هذا البريد مسجَّلًا لدينا، ستصلك رسالة بها رابط تعيين كلمة مرور جديدة.
        الرابط صالح لمدة محدودة.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-base font-medium text-brand-600 underline-offset-4 hover:underline"
      >
        العودة لتسجيل الدخول
      </Link>
    </div>
  )
}
