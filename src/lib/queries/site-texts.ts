import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TEXTS } from '@/lib/site/texts'

/**
 * نصوص الصفحة العامة: الافتراضي مع ما غيّره المدير فوقه.
 *
 * القيمة الفارغة تُهمَل عمدًا — إفراغ الحقل في اللوحة يعني «أرجعه لأصله»
 * لا «اعرض فراغًا»، فلا تبقى الصفحة بعنوان مفقود بنقرة واحدة.
 */
export async function getSiteTexts(): Promise<(key: string) => string> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'site_texts')
    .maybeSingle()

  const overrides = (data?.value ?? {}) as Record<string, unknown>

  return (key: string) => {
    const custom = overrides[key]
    if (typeof custom === 'string' && custom.trim()) return custom
    return DEFAULT_TEXTS[key] ?? ''
  }
}
