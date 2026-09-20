import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/session'

/**
 * وظيفتان لا ثالث لهما:
 *   1. تجديد جلسة Supabase على كل طلب (وإلا انتهت صلاحيتها أثناء التصفّح).
 *   2. إعادة توجيه سريعة — **تجربة مستخدم لا أمان**.
 *
 * الدور يُقرأ من القاعدة لا من التوكن: بيانات التوكن قد تكون قديمة بعد
 * تغيير الدور، والقاعدة هي المصدر الوحيد للحقيقة. حتى لو تسلّل طلب من هنا،
 * RLS تمنعه على مستوى الصف.
 */

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const PUBLIC_ROUTES = ['/', '/suspended', '/terms', '/privacy']

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (!user) {
    if (isAuthRoute || isPublicRoute) return response
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // بعد الدخول نُعيده إلى ما كان يقصده
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile) return response

  if (profile.status === 'suspended') {
    if (pathname === '/suspended') return response
    const url = request.nextUrl.clone()
    url.pathname = '/suspended'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const home =
    profile.role === 'admin' || profile.role === 'super_admin'
      ? '/admin'
      : profile.role === 'support'
        ? '/support'
        : '/student'

  // مستخدم مسجَّل لا يرى صفحات الدخول
  if (isAuthRoute || pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = home
    url.search = ''
    return NextResponse.redirect(url)
  }

  const isAdminArea = pathname.startsWith('/admin')
  const isSupportArea = pathname.startsWith('/support')
  const isStudentArea = pathname.startsWith('/student')

  const allowed =
    (isAdminArea && home === '/admin') ||
    (isSupportArea && (home === '/support' || home === '/admin')) ||
    (isStudentArea && home === '/student') ||
    (!isAdminArea && !isSupportArea && !isStudentArea)

  if (!allowed) {
    const url = request.nextUrl.clone()
    url.pathname = home
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // كل المسارات عدا الملفات الساكنة والصور وملفات الميتا
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
