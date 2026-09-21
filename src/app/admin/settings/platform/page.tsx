import type { Metadata } from 'next'
import { Palette, Image as ImageIcon, Type } from 'lucide-react'
import { requireAdminPage } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsBack } from '@/components/admin/settings-back'
import { BrandingForm, type BrandingDefaults } from '@/components/admin/branding-form'
import { LogoForm } from '@/components/admin/logo-form'
import { SiteTextsForm } from '@/components/admin/site-texts-form'

export const metadata: Metadata = { title: 'إعدادات المنصة' }

export default async function PlatformSettingsPage() {
  await requireAdminPage('settings')
  const supabase = await createClient()

  const [brandingRes, textsRes] = await Promise.all([
    supabase.from('platform_settings').select('value').eq('key', 'branding').maybeSingle(),
    supabase.from('platform_settings').select('value').eq('key', 'site_texts').maybeSingle(),
  ])

  const branding = (brandingRes.data?.value ?? {}) as Record<string, string>
  const siteTexts = (textsRes.data?.value ?? {}) as Record<string, string>

  const defaults: BrandingDefaults = {
    site_name: branding.site_name ?? '',
    code_prefix: branding.code_prefix ?? '',
    support_email: branding.support_email ?? '',
    support_phone: branding.support_phone ?? '',
    whatsapp: branding.whatsapp ?? '',
    facebook: branding.facebook ?? '',
    youtube: branding.youtube ?? '',
    telegram: branding.telegram ?? '',
    instagram: branding.instagram ?? '',
  }

  return (
    <div className="space-y-6">
      <SettingsBack />

      <PageHeader
        title="إعدادات المنصة"
        description="الاسم والشعار وبيانات التواصل والروابط التي تظهر للطلاب."
      />

      <Card>
        <CardHeader title="شعار المنصة" icon={ImageIcon} />
        <LogoForm
          current={branding.logo_url ?? null}
          siteName={defaults.site_name || 'المنصة'}
        />
      </Card>

      <Card>
        <CardHeader title="البيانات الأساسية" icon={Palette} />
        <BrandingForm defaults={defaults} />
      </Card>

      <Card>
        <CardHeader title="نصوص الصفحة الرئيسية" icon={Type} />
        <SiteTextsForm current={siteTexts} />
      </Card>
    </div>
  )
}
