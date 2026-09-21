import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatYear } from '@/lib/utils/format'

// ترتيب الروابط يتبع أهمية الصفحة للزائر لا ترتيب إنشائها في القاعدة
const PAGE_ORDER = ['faq', 'contact', 'terms', 'privacy']

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'فيسبوك',
  youtube: 'يوتيوب',
  telegram: 'تيليجرام',
  instagram: 'إنستجرام',
}

/**
 * تذييل الموقع العام.
 * روابط الصفحات الثابتة تأتي من قاعدة البيانات: الصفحة غير المنشورة
 * لا يظهر رابطها، فلا يصل الزائر إلى صفحة فارغة.
 */
export async function SiteFooter({ about, credit }: { about: string; credit: string }) {
  const supabase = await createClient()

  const [pagesRes, brandingRes] = await Promise.all([
    supabase.from('static_pages').select('slug, title').eq('is_published', true),
    supabase.from('platform_settings').select('value').eq('key', 'branding').maybeSingle(),
  ])

  const pages = (pagesRes.data ?? []).sort((a, b) => {
    const ai = PAGE_ORDER.indexOf(a.slug)
    const bi = PAGE_ORDER.indexOf(b.slug)
    return (ai === -1 ? PAGE_ORDER.length : ai) - (bi === -1 ? PAGE_ORDER.length : bi)
  })
  const branding = (brandingRes.data?.value ?? {}) as Record<string, string>

  const socials = Object.entries(SOCIAL_LABELS)
    .map(([key, label]) => ({ label, href: branding[key] }))
    .filter((s): s is { label: string; href: string } => Boolean(s.href))

  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-x-6 gap-y-5 px-5 py-6 sm:px-8">
        <div className="min-w-0">
          <p className="nums-ar text-sm text-ink-muted">
            {about} © {formatYear(new Date().getFullYear())}
          </p>
          {/* سطر جهة التطوير: منفصل وأخفت، فلا يزاحم هوية المنصة */}
          <p className="mt-1 text-sm text-ink-faint">{credit}</p>

          {branding.support_email && (
            <p className="mt-2 text-sm text-ink-muted">
              للدعم:{' '}
              <a
                href={`mailto:${branding.support_email}`}
                dir="ltr"
                className="underline-offset-4 hover:underline"
              >
                {branding.support_email}
              </a>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          {pages.length > 0 && (
            <nav aria-label="صفحات المنصة" className="flex flex-col gap-1.5 text-sm text-ink-muted">
              {pages.map((p) => (
                <Link key={p.slug} href={`/p/${p.slug}`} className="underline-offset-4 hover:underline">
                  {p.title}
                </Link>
              ))}
            </nav>
          )}

          {socials.length > 0 && (
            <nav aria-label="حسابات التواصل" className="flex flex-col gap-1.5 text-sm text-ink-muted">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          )}

          <nav aria-label="روابط الحساب" className="flex flex-col gap-1.5 text-sm text-ink-muted">
            <Link href="/login" className="underline-offset-4 hover:underline">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="underline-offset-4 hover:underline">
              إنشاء حساب
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
