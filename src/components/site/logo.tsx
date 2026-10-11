import Link from 'next/link'
import Image from 'next/image'

/**
 * على أي أرضية يوضع الشعار؟ تحدد النسخة واللون ليبقى مقروءًا:
 * `onDark` للهيدر الأخضر الداكن (نسخة بيضاء)، و`onLight` للهيدر الفاتح (نسخة سوداء).
 */
export type LogoTone = 'onDark' | 'onLight'

const MARK_SRC: Record<LogoTone, string> = {
  onDark: '/brand/logo-white.png',
  onLight: '/brand/logo-black.png',
}

/**
 * علامة المنصة: حرف مخطوط بخلفية شفافة، بنسختين متطابقتين في المقاس.
 * النسختان من `public/brand`، والارتفاع من الاستدعاء والعرض يتبعه.
 */
export function BrandMark({
  tone,
  className = 'h-10',
}: {
  tone: LogoTone
  className?: string
}) {
  return (
    <Image
      src={MARK_SRC[tone]}
      alt=""
      width={342}
      height={384}
      className={`w-auto shrink-0 ${className}`}
    />
  )
}

const TEXT: Record<LogoTone, { name: string; tagline: string }> = {
  onDark: { name: 'text-ink-invert', tagline: 'text-accent-soft' },
  onLight: { name: 'text-ink', tagline: 'text-accent-ink' },
}

/**
 * الهوية كاملة: العلامة ثم الاسم وتحته العبارة.
 * `tone` بحسب لون الهيدر الذي تُوضع عليه.
 */
export function Logo({
  name,
  tagline,
  tone = 'onDark',
}: {
  name: string
  tagline: string
  tone?: LogoTone
}) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3 rounded-[var(--radius-field)]">
      <BrandMark tone={tone} className="h-10 sm:h-11" />
      <span className="min-w-0">
        <span
          className={`block truncate text-base font-semibold leading-tight sm:text-[1.0625rem] ${TEXT[tone].name}`}
        >
          {name}
        </span>
        <span className={`block truncate text-xs leading-tight sm:text-[0.8125rem] ${TEXT[tone].tagline}`}>
          {tagline}
        </span>
      </span>
    </Link>
  )
}
