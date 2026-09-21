import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/** رجوع إلى صفحة الإعدادات — يتكرّر في كل قسم فيها. */
export function SettingsBack() {
  return (
    <Link
      href="/admin/settings"
      className="inline-flex items-center gap-1.5 text-base text-ink-muted underline-offset-4 hover:text-ink hover:underline"
    >
      <ArrowRight className="size-4" aria-hidden />
      كل الإعدادات
    </Link>
  )
}
