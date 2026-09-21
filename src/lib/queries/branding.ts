import { createClient } from '@/lib/supabase/server'

export type Branding = {
  siteName: string | null
  logoUrl: string | null
  supportEmail: string | null
  whatsapp: string | null
}

/** هوية المنصة كما ضبطها المشرف. يقرؤها الزائر: `platform_settings` عامّة للقراءة. */
export async function getBranding(): Promise<Branding> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'branding')
    .maybeSingle()

  const v = (data?.value ?? {}) as Record<string, string>

  return {
    siteName: v.site_name ?? null,
    logoUrl: v.logo_url ?? null,
    supportEmail: v.support_email ?? null,
    whatsapp: v.whatsapp ?? null,
  }
}
