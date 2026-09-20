import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export type UserRole = Database['public']['Enums']['user_role']
export type AccountStatus = Database['public']['Enums']['account_status']

export type SessionUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
  status: AccountStatus
  avatarUrl: string | null
  gradeId: string | null
}

/**
 * حرّاس الواجهة.
 *
 * تحذير مقصود: هذه الدوال **لتجربة المستخدم فقط** — إعادة توجيه، إخفاء عنصر.
 * التفويض الحقيقي في RLS وRPC داخل القاعدة، ويُفترض أن كل طلب من المتصفح
 * عدائي حتى لو مرّ من هنا (البند 27).
 */

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status, avatar_url, grade_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    status: profile.status,
    avatarUrl: profile.avatar_url,
    gradeId: profile.grade_id,
  }
}

export const isAdmin = (u: SessionUser | null): boolean =>
  u?.role === 'admin' || u?.role === 'super_admin'

export const isSuperAdmin = (u: SessionUser | null): boolean => u?.role === 'super_admin'
export const isSupport = (u: SessionUser | null): boolean => u?.role === 'support'
export const isStaff = (u: SessionUser | null): boolean => isAdmin(u) || isSupport(u)
export const isStudent = (u: SessionUser | null): boolean => u?.role === 'student'

/** الصفحة المناسبة لكل دور بعد تسجيل الدخول. */
export function homePathFor(role: UserRole): string {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin'
    case 'support':
      return '/support'
    case 'student':
      return '/student'
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.status === 'suspended') redirect('/suspended')
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!isAdmin(user)) redirect(homePathFor(user.role))
  return user
}

export async function requireSupport(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!isSupport(user) && !isAdmin(user)) redirect(homePathFor(user.role))
  return user
}

export async function requireStudent(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!isStudent(user)) redirect(homePathFor(user.role))
  return user
}
