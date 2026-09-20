import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * تحميل مرفق.
 *
 * لا يُرسَل رابط التخزين إلى المتصفح أبدًا. المسار هنا:
 *   1. يقرأ صف المرفق — وRLS تُرجع null لمن لا يستحقه، فالفحص ضمني وحقيقي.
 *   2. يوقّع رابطًا صالحًا ٦٠ ثانية فقط.
 *   3. يحوّل المستخدم إليه.
 * حتى لو سُرّب الرابط الموقّع، صلاحيته تنتهي قبل أن يُنشر (البند 25).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL))
  }

  // RLS على attachments تشترط تسجيلًا نشطًا في كورس مرتبط بالمرفق
  const { data: attachment } = await supabase
    .from('attachments')
    .select('storage_path, file_name')
    .eq('id', id)
    .maybeSingle()

  if (!attachment) {
    return new NextResponse('هذا الملف غير متاح لك.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const { data: signed, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(attachment.storage_path, 60, { download: attachment.file_name })

  if (error || !signed) {
    return new NextResponse('تعذّر تجهيز الملف. أعد المحاولة.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  return NextResponse.redirect(signed.signedUrl, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
