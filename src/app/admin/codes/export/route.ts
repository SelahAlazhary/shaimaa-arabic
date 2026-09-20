import { createClient } from '@/lib/supabase/server'
import { toCsv, csvResponse } from '@/lib/csv'

const STATUS_LABELS = {
  active: 'متاح',
  used: 'مستخدم',
  expired: 'منتهٍ',
  cancelled: 'ملغى',
} as const

/** الصلاحية تُفحص هنا صراحةً: المسار endpoint يمكن استدعاؤه مباشرة. */
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('غير مصرّح', { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return new Response('ممنوع', { status: 403 })
  }

  const { data } = await supabase
    .from('activation_codes')
    .select('code, status, batch, grants_days, expires_at, created_at, courses(title)')
    .order('created_at', { ascending: false })
    .limit(10000)

  const rows = (data ?? []) as unknown as {
    code: string
    status: keyof typeof STATUS_LABELS
    batch: string | null
    grants_days: number | null
    expires_at: string | null
    created_at: string
    courses: { title: string } | null
  }[]

  const csv = toCsv(
    ['الكود', 'الكورس', 'الحالة', 'الدفعة', 'مدة الاشتراك (يوم)', 'تنتهي صلاحية الكود', 'تاريخ التوليد'],
    rows.map((r) => [
      r.code,
      r.courses?.title ?? null,
      STATUS_LABELS[r.status],
      r.batch,
      r.grants_days,
      r.expires_at ? new Date(r.expires_at).toISOString().slice(0, 10) : null,
      new Date(r.created_at).toISOString().slice(0, 10),
    ]),
  )

  return csvResponse(`اكواد-التفعيل-${new Date().toISOString().slice(0, 10)}.csv`, csv)
}
