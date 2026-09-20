import Link from 'next/link'
import { LogIn, UserPlus } from 'lucide-react'
import { AUTH } from '@/lib/site/content'
import { cn } from '@/lib/utils/cn'

/**
 * زرّا الحساب في الشريط العلوي.
 * على الشاشات الضيّقة يصيران أيقونتين باسم مسموع بدل أن يزاحما الهوية.
 */
export function AuthButtons({ block = false }: { block?: boolean }) {
  return (
    <>
      <Link
        href="/login"
        aria-label={AUTH.login}
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-field)]',
          'border border-accent-soft/60 px-4 text-sm font-medium text-ink-invert',
          'transition-colors hover:border-accent-soft hover:bg-brand-700',
          block ? 'w-full' : 'size-11 px-0 sm:w-auto sm:px-4',
        )}
      >
        <span className={block ? '' : 'hidden sm:inline'}>{AUTH.login}</span>
        <LogIn className="size-4 shrink-0" aria-hidden />
      </Link>

      <Link
        href="/register"
        aria-label={AUTH.register}
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-field)]',
          'bg-accent px-4 text-sm font-semibold text-brand-900',
          'transition-colors hover:bg-accent-soft',
          block ? 'w-full' : 'size-11 px-0 sm:w-auto sm:px-4',
        )}
      >
        <span className={block ? '' : 'hidden sm:inline'}>{AUTH.register}</span>
        <UserPlus className="size-4 shrink-0" aria-hidden />
      </Link>
    </>
  )
}
