import { createClient } from '@/lib/supabase/server'

/** بيانات مرجعية يحتاجها نموذج التسجيل قبل وجود حساب. RLS تتيحها للزوار. */

export type Stage = { id: string; name_ar: string; requiresSection: boolean }
export type Grade = { id: string; name_ar: string; stage_id: string | null }
export type Governorate = { id: string; name_ar: string }

export type RegistrationReference = {
  stages: Stage[]
  grades: Grade[]
  governorates: Governorate[]
}

export async function getRegistrationReference(): Promise<RegistrationReference> {
  const supabase = await createClient()

  const [stagesRes, gradesRes, govRes] = await Promise.all([
    supabase
      .from('education_stages')
      .select('id, name_ar')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('grades')
      .select('id, name_ar, stage_id')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    supabase.from('governorates').select('id, name_ar').order('sort_order', { ascending: true }),
  ])

  return {
    // الشُّعبة (علمي/أدبي) تخصّ الثانوي وحده؛ الإعدادي ليس فيه تقسيم
    stages: (stagesRes.data ?? []).map((s) => ({
      ...s,
      requiresSection: s.name_ar.includes('ثانوي'),
    })),
    grades: gradesRes.data ?? [],
    governorates: govRes.data ?? [],
  }
}
