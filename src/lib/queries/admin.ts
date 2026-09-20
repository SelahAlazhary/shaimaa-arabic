import { createClient } from '@/lib/supabase/server'

/**
 * استعلامات لوحة الإدارة.
 * كلها تعتمد على `head: true` مع `count: 'exact'` لبطاقات الأرقام: تُرجع العدد
 * بلا نقل أي صف عبر الشبكة (البند 37).
 */

export type AdminOverview = {
  totalStudents: number
  activeStudents: number
  suspendedStudents: number
  totalCourses: number
  publishedCourses: number
  activeEnrollments: number
  availableCodes: number
  usedCodes: number
  openTickets: number
  recentStudents: {
    id: string
    fullName: string
    email: string
    phone: string | null
    gradeName: string | null
    status: 'active' | 'suspended'
    createdAt: string
  }[]
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient()

  const count = (q: PromiseLike<{ count: number | null }>) => q

  const [
    students, active, suspended, courses, published,
    enrollments, codesAvailable, codesUsed, tickets, recent,
  ] = await Promise.all([
    count(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')),
    count(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active')),
    count(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'suspended')),
    count(supabase.from('courses').select('id', { count: 'exact', head: true })),
    count(supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    count(supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    count(supabase.from('activation_codes').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    count(supabase.from('activation_codes').select('id', { count: 'exact', head: true }).eq('status', 'used')),
    count(supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'pending'])),
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, status, created_at, grades(name_ar)')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const recentRows = (recent.data ?? []) as unknown as {
    id: string
    full_name: string
    email: string
    phone: string | null
    status: 'active' | 'suspended'
    created_at: string
    grades: { name_ar: string } | null
  }[]

  return {
    totalStudents: students.count ?? 0,
    activeStudents: active.count ?? 0,
    suspendedStudents: suspended.count ?? 0,
    totalCourses: courses.count ?? 0,
    publishedCourses: published.count ?? 0,
    activeEnrollments: enrollments.count ?? 0,
    availableCodes: codesAvailable.count ?? 0,
    usedCodes: codesUsed.count ?? 0,
    openTickets: tickets.count ?? 0,
    recentStudents: recentRows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      gradeName: r.grades?.name_ar ?? null,
      status: r.status,
      createdAt: r.created_at,
    })),
  }
}

export type StudentRow = {
  id: string
  fullName: string
  email: string
  phone: string | null
  gradeName: string | null
  stageName: string | null
  governorateName: string | null
  schoolName: string | null
  section: 'scientific' | 'literary' | null
  status: 'active' | 'suspended'
  createdAt: string
}

export const STUDENTS_PAGE_SIZE = 20

/** بحث بالاسم أو البريد أو الهاتف مع ترقيم صفحات (البند 35). */
export async function getStudents({
  query = '',
  status = '',
  gradeId = '',
  page = 1,
}: {
  query?: string
  status?: string
  gradeId?: string
  page?: number
}): Promise<{ rows: StudentRow[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * STUDENTS_PAGE_SIZE

  let q = supabase
    .from('profiles')
    .select(
      'id, full_name, email, phone, school_name, section, status, created_at, grades(name_ar), education_stages(name_ar), governorates(name_ar)',
      { count: 'exact' },
    )
    .eq('role', 'student')

  const term = query.trim()
  if (term) {
    // النص يُمرَّر داخل or() فتُزال الفواصل والأقواس منعًا لكسر التعبير
    const safe = term.replace(/[,()]/g, ' ').trim()
    q = q.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`)
  }
  if (status === 'active' || status === 'suspended') q = q.eq('status', status)
  if (gradeId) q = q.eq('grade_id', gradeId)

  const { data, count } = await q
    .order('created_at', { ascending: false })
    .range(from, from + STUDENTS_PAGE_SIZE - 1)

  const rows = (data ?? []) as unknown as {
    id: string
    full_name: string
    email: string
    phone: string | null
    school_name: string | null
    section: 'scientific' | 'literary' | null
    status: 'active' | 'suspended'
    created_at: string
    grades: { name_ar: string } | null
    education_stages: { name_ar: string } | null
    governorates: { name_ar: string } | null
  }[]

  return {
    total: count ?? 0,
    rows: rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      gradeName: r.grades?.name_ar ?? null,
      stageName: r.education_stages?.name_ar ?? null,
      governorateName: r.governorates?.name_ar ?? null,
      schoolName: r.school_name,
      section: r.section,
      status: r.status,
      createdAt: r.created_at,
    })),
  }
}
