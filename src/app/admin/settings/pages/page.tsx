import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { requireAdminPage } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsBack } from '@/components/admin/settings-back'
import {
  StaticPagesManager,
  type StaticPageRow,
} from '@/components/admin/static-pages-manager'

export const metadata: Metadata = { title: 'الصفحات الثابتة' }

// ترتيب العرض يتبع أهمية الصفحة للزائر لا ترتيب إنشائها
const ORDER = ['faq', 'contact', 'terms', 'privacy']

export default async function StaticPagesSettingsPage() {
  await requireAdminPage('settings')
  const supabase = await createClient()

  const { data } = await supabase
    .from('static_pages')
    .select('slug, title, content, is_published, updated_at')

  const pages: StaticPageRow[] = (data ?? [])
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      content: p.content ?? '',
      isPublished: p.is_published,
      updatedAt: p.updated_at,
    }))
    .sort((a, b) => {
      const ai = ORDER.indexOf(a.slug)
      const bi = ORDER.indexOf(b.slug)
      return (ai === -1 ? ORDER.length : ai) - (bi === -1 ? ORDER.length : bi)
    })

  return (
    <div className="space-y-6">
      <SettingsBack />

      <PageHeader
        title="الصفحات الثابتة"
        description="صفحات يقرؤها الزائر دون تسجيل. تظهر روابطها في تذييل الموقع بعد نشرها."
      />

      <Card>
        <CardHeader title="الصفحات" icon={FileText} />
        {pages.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="لا صفحات بعد"
            description="لم تُهيَّأ الصفحات الثابتة في قاعدة البيانات. تواصل مع من يدير الخادم."
          />
        ) : (
          <StaticPagesManager pages={pages} />
        )}
      </Card>
    </div>
  )
}
