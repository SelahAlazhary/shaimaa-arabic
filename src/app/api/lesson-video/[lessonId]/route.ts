import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * بثّ فيديو مستضاف داخل المنصة.
 *
 * الدلو `lesson-videos` خاصّ، فلا يُقرأ برابط ثابت. هذا المسار يتحقّق من
 * استحقاق الطالب ثم يوقّع رابطًا قصير العمر ويحوّل إليه. لا يُخزَّن الرابط
 * الموقّع في صفحة ولا يُرسل إلى العميل نصًّا، فنسخُه لا يفيد طويلًا.
 *
 * الاستحقاق تتكفّل به RLS على `lesson_videos`: الصفّ لا يعود إلا لمن
 * اشترك في المقرر أو كان الدرس مجانيًّا.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'يلزم تسجيل الدخول.' }, { status: 401 })
  }

  const { data: video } = await supabase
    .from('lesson_videos')
    .select('storage_path')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (!video?.storage_path) {
    return NextResponse.json({ error: 'لا يوجد فيديو متاح لهذا الدرس.' }, { status: 404 })
  }

  // ساعتان تكفيان أطول درس مع التوقّف والرجوع، وتنتهي قبل أن تُشارَك
  const { data: signed, error } = await supabase.storage
    .from('lesson-videos')
    .createSignedUrl(video.storage_path, 60 * 60 * 2)

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'تعذّر تشغيل الفيديو الآن.' }, { status: 502 })
  }

  // 302 لا 307: المتصفّح يعيد طلبات النطاق (Range) على الرابط الموقّع مباشرة
  return NextResponse.redirect(signed.signedUrl, {
    status: 302,
    headers: {
      // الرابط الموقّع ينتهي، فلا يُخزَّن هذا التحويل في أي وسيط
      'Cache-Control': 'private, no-store',
    },
  })
}
