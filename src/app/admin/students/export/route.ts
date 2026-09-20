import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toCsv, csvResponse } from '@/lib/csv'

const SECTION_LABELS = { scientific: 'علمي', literary: 'أدبي' } as const
const STATUS_LABELS = { active: 'نشط', suspended: 'موقوف' } as const

/**
 * تصدير الطلاب.
 * الصلاحية تُفحص هنا صراحةً ولا يُعتمد على proxy وحده: المسار endpoint
 * يمكن استدعاؤه مباشرة. وRLS تبقى الطبقة الأخيرة على أي حال.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('غير مصرّح', { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return new Response('ممنوع', { status: 403 })
  }

  const sp = request.nextUrl.searchParams
  let q = supabase
    .from('profiles')
    .select(
      'full_name, email, phone, school_name, section, status, created_at, grades(name_ar), education_stages(name_ar), governorates(name_ar)',
    )
    .eq('role', 'student')

  const term = (sp.get('q') ?? '').trim()
  if (term) {
    const safe = term.replace(/[,()]/g, ' ').trim()
    q = q.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`)
  }
  const status = sp.get('status')
  if (status === 'active' || status === 'suspended') q = q.eq('status', status)
  const grade = sp.get('grade')
  if (grade) q = q.eq('grade_id', grade)

  const { data } = await q.order('created_at', { ascending: false }).limit(5000)

  const rows = (data ?? []) as unknown as {
    full_name: string
    email: string
    phone: string | null
    school_name: string | null
    section: keyof typeof SECTION_LABELS | null
    status: keyof typeof STATUS_LABELS
    created_at: string
    grades: { name_ar: string } | null
    education_stages: { name_ar: string } | null
    governorates: { name_ar: string } | null
  }[]

  const csv = toCsv(
    ['الاسم', 'البريد الإلكتروني', 'رقم الموبايل', 'المرحلة', 'الصف', 'الشعبة', 'المحافظة', 'المدرسة', 'الحالة', 'تاريخ التسجيل'],
    rows.map((r) => [
      r.full_name,
      r.email,
      r.phone,
      r.education_stages?.name_ar ?? null,
      r.grades?.name_ar ?? null,
      r.section ? SECTION_LABELS[r.section] : null,
      r.governorates?.name_ar ?? null,
      r.school_name,
      STATUS_LABELS[r.status],
      new Date(r.created_at).toISOString().slice(0, 10),
    ]),
  )

  const stamp = new Date().toISOString().slice(0, 10)
  return csvResponse(`الطلاب-${stamp}.csv`, csv)
}
