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

/**
 * الهوية في الهيدر: العلامة وحدها. الاسم لا يُعرض نصًّا لكنه يبقى
 * `aria-label` للرابط، فيعرف القارئ الصوتي وجهة الرابط واسم المنصة.
 */
export function Logo({ name, tone = 'onDark' }: { name: string; tone?: LogoTone }) {
  return (
    <Link href="/" aria-label={name} className="flex shrink-0 items-center rounded-[var(--radius-field)]">
      <BrandMark tone={tone} className="h-12 sm:h-14" />
    </Link>
  )
}
