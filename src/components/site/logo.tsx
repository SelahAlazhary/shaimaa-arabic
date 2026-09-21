import Link from 'next/link'
import Image from 'next/image'


/**
 * علامة المنصة: كتاب مفتوح تعلوه ورقة، مرسوم SVG لا صورة،
 * فيبقى حادًّا في كل مقاس ويرث اللون من سياقه.
 */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M4 9.5c3.5-1.3 7-1.3 10.5 0v15c-3.5-1.3-7-1.3-10.5 0v-15Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M28 9.5c-3.5-1.3-7-1.3-10.5 0v15c3.5-1.3 7-1.3 10.5 0v-15Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 8.2c1.1-2.4 3-3.8 5.6-4.2-.2 2.8-1.5 4.7-3.9 5.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 9.2v16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

/**
 * الهوية كاملة: العلامة ثم الاسم وتحته العبارة.
 * شعار مرفوع من الإعدادات يحلّ محلّ العلامة المرسومة إن وُجد.
 */
export function Logo({
  name,
  tagline,
  logoUrl,
}: {
  name: string
  tagline: string
  logoUrl?: string | null
}) {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-3 rounded-[var(--radius-field)]"
    >
      {logoUrl ? (
        <span className="relative size-9 shrink-0 sm:size-10">
          <Image src={logoUrl} alt="" fill sizes="2.5rem" className="object-contain" />
        </span>
      ) : (
        <LogoMark className="size-9 shrink-0 text-accent-soft sm:size-10" />
      )}
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold leading-tight text-ink-invert sm:text-[1.0625rem]">
          {name}
        </span>
        <span className="block truncate text-xs leading-tight text-accent-soft sm:text-[0.8125rem]">
          {tagline}
        </span>
      </span>
    </Link>
  )
}
