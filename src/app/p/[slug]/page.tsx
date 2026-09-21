import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/site/navbar'
import { SiteFooter } from '@/components/site/site-footer'
import { getSiteTexts } from '@/lib/queries/site-texts'
import { getBranding } from '@/lib/queries/branding'
import { createClient } from '@/lib/supabase/server'

/** الصفحات الثابتة تتغيّر نادرًا، فتُبنى مرة كل ساعة. */
export const revalidate = 3600

async function getPage(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('static_pages')
    .select('title, content, is_published, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  // RLS تعيد غير المنشورة للمشرف؛ الصفحة العامة تتجاهلها كي تتطابق
  // معاينة المشرف مع ما يراه الزائر
  return data?.is_published ? data : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: 'صفحة غير موجودة' }

  return {
    title: page.title,
    description: (page.content ?? '').trim().slice(0, 160) || undefined,
  }
}

type Block = { kind: 'heading' | 'text'; text: string }

/**
 * المحتوى نصّ عادي لا HTML: ما يكتبه المشرف لا يُحقن في الصفحة.
 * السطر المنتهي بنقطتين عنوان فرعي، وما بعده فقرة حتى العنوان التالي.
 */
function parseBlocks(content: string): Block[] {
  const blocks: Block[] = []

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue

    if (/[:：]$/.test(line)) {
      blocks.push({ kind: 'heading', text: line.replace(/[:：]$/, '') })
      continue
    }

    const last = blocks.at(-1)
    if (last?.kind === 'text') last.text += `\n${line}`
    else blocks.push({ kind: 'text', text: line })
  }

  return blocks
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  const t = await getSiteTexts()
  const branding = await getBranding()
  const blocks = parseBlocks(page.content ?? '')

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Navbar
        name={branding.siteName ?? t('site.name')}
        tagline={t('site.tagline')}
        logoUrl={branding.logoUrl}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{page.title}</h1>

        <div className="mt-7 space-y-4">
          {blocks.map((block, i) =>
            block.kind === 'heading' ? (
              <h2 key={i} className="pt-3 text-lg font-semibold text-ink first:pt-0">
                {block.text}
              </h2>
            ) : (
              <p key={i} className="whitespace-pre-line text-base leading-[2] text-ink-muted">
                {block.text}
              </p>
            ),
          )}
        </div>
      </main>

      <SiteFooter about={t('footer.about')} credit={t('footer.credit')} />
    </div>
  )
}
