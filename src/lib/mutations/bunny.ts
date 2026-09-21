'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { messageFor, toErrorCode } from '@/lib/errors'
import {
  bunnyConfig,
  createBunnyVideo,
  deleteBunnyVideo,
  bunnyUploadSignature,
} from '@/lib/bunny'

async function adminClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) return null

  return supabase
}

export type BunnyTicket = {
  ok: true
  videoId: string
  libraryId: string
  signature: string
  expire: number
} | {
  ok: false
  message: string
}

/**
 * تذكرة رفع إلى Bunny Stream.
 *
 * تُنشئ سجلّ الفيديو في المكتبة وتعيد توقيعًا قصير العمر يرفع به المتصفّح
 * الملفَّ مباشرةً. مفتاح المكتبة لا يغادر الخادم، والملف لا يمرّ به.
 */
export async function createBunnyUploadTicket(
  lessonId: string,
  lessonTitle: string,
): Promise<BunnyTicket> {
  const cfg = bunnyConfig()
  if (!cfg) return { ok: false, message: 'Bunny Stream غير مضبوط على هذا الخادم.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  // العنوان في مكتبة Bunny يحمل معرّف الدرس كي يُعرف مصدره من لوحتهم
  const created = await createBunnyVideo(cfg, `${lessonTitle} — ${lessonId}`)
  if (!created.ok) return { ok: false, message: created.message }

  const { signature, expire, libraryId } = bunnyUploadSignature(cfg, created.videoId)
  return { ok: true, videoId: created.videoId, libraryId, signature, expire }
}

/** يربط فيديو Bunny المرفوع بالدرس. */
export async function saveBunnyVideo(input: {
  lessonId: string
  courseId: string
  videoId: string
  requiredPercent: number
  allowDownload: boolean
}) {
  const cfg = bunnyConfig()
  if (!cfg) return { ok: false, message: 'Bunny Stream غير مضبوط على هذا الخادم.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const percent = Math.min(100, Math.max(10, Math.round(input.requiredPercent)))

  // المصدر واحد: ربط Bunny يمحو الملف المحلّي والرابط الخارجي معًا
  const { error } = await supabase.from('lesson_videos').upsert(
    {
      lesson_id: input.lessonId,
      bunny_video_id: input.videoId,
      storage_path: null,
      video_url: '',
      provider: 'bunny',
      required_percent: percent,
      allow_download: input.allowDownload,
    },
    { onConflict: 'lesson_id' },
  )

  if (error) {
    // الربط فشل، فالفيديو في Bunny لا يشير إليه درس — يُزال كي لا يُحاسَب عليه
    await deleteBunnyVideo(cfg, input.videoId)
    return { ok: false, message: messageFor(toErrorCode(error)) }
  }

  revalidatePath(`/admin/courses/${input.courseId}`)
  revalidatePath('/student', 'layout')
  return { ok: true, message: 'رُفع الفيديو إلى Bunny ورُبط بالدرس.' }
}

/** يُلغي فيديوًا أُنشئ في Bunny ثم انقطع رفعه. */
export async function discardBunnyVideo(videoId: string) {
  const cfg = bunnyConfig()
  if (!cfg) return { ok: false, message: 'Bunny Stream غير مضبوط.' }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  await deleteBunnyVideo(cfg, videoId)
  return { ok: true, message: 'أُلغي الرفع.' }
}
