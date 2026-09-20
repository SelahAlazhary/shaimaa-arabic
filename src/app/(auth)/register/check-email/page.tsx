import type { Metadata } from 'next'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'أكّد بريدك' }

export default function CheckEmailPage() {
  return (
    <div className="text-center">
      <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-success-bg text-success">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold text-ink">راجع بريدك الإلكتروني</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        أرسلنا لك رسالة تأكيد. افتحها واضغط الرابط لتفعيل حسابك، ثم سجّل الدخول.
      </p>
      <p className="mt-4 text-sm text-ink-faint">
        لم تصلك الرسالة؟ تأكد من مجلد الرسائل غير المرغوبة (Spam).
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-sm font-medium text-brand-600 underline-offset-4 hover:underline"
      >
        العودة لتسجيل الدخول
      </Link>
    </div>
  )
}
