import Image from 'next/image'
import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * غلاف الكورس في القوائم: صورته إن رُفعت، وإلا أرضية خضراء بالهوية
 * وأيقونة تخرّج، فلا تبقى البطاقة بفراغ رمادي.
 */
export function CourseCover({
  url,
  title,
  className,
  sizes = '(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw',
}: {
  url: string | null
  title: string
  className?: string
  sizes?: string
}) {
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden bg-brand-800', className)}>
      {url ? (
        <Image src={url} alt={`غلاف ${title}`} fill sizes={sizes} className="object-cover" />
      ) : (
        <span
          aria-hidden
          className="grid size-full place-items-center bg-linear-to-br from-brand-700 to-brand-900 text-accent-soft/80"
        >
          <GraduationCap className="size-12" />
        </span>
      )}
    </div>
  )
}
