import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * يستقبل رمز التأكيد من رسالة البريد ويبدّله بجلسة.
 * `next` يُقبل فقط إن كان مسارًا داخليًا — وإلا صار الرابط أداة تحويل مفتوح
 * يمكن إرسالها للطلاب لخداعهم (البند 39).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/student'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/student'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
