'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { messageFor, toErrorCode } from '@/lib/errors'

/**
 * صورة المقرر.
 *
 * النوع يُقرأ من بصمة الملف لا من امتداده: ملف تنفيذي مُسمّى `a.png`
 * يمرّ من فحص الاسم ولا يمرّ من هنا.
 */
const ALLOWED = {
  'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
  'image/webp': { ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] },
} as const

type AllowedMime = keyof typeof ALLOWED

const MAX_BYTES = 5 * 1024 * 1024

async function sniff(file: File): Promise<AllowedMime | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())

  for (const [mime, spec] of Object.entries(ALLOWED) as [AllowedMime, { magic: readonly number[] }][]) {
    if (spec.magic.every((b, i) => head[i] === b)) {
      // WEBP يبدأ بـRIFF مثل صيغ أخرى، فنتحقّق من العلامة الثانية
      if (mime === 'image/webp') {
        const tag = String.fromCharCode(...head.slice(8, 12))
        if (tag !== 'WEBP') continue
      }
      return mime
    }
  }
  return null
}

async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) return null
  return supabase
}

export async function uploadCourseImage(courseId: string, formData: FormData) {
  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'اختر صورة أولًا.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: 'حجم الصورة أكبر من ٥ ميجابايت.' }
  }

  const mime = await sniff(file)
  if (!mime) {
    return { ok: false, message: 'الملف ليس صورة صالحة. المسموح: JPG أو PNG أو WebP.' }
  }

  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  // اسم جديد في كل رفعة: يتجاوز كاش المتصفّح والـCDN بلا إبطال يدوي
  const path = `${courseId}/${crypto.randomUUID()}.${ALLOWED[mime].ext}`

  const { error: uploadError } = await supabase.storage
    .from('course-images')
    .upload(path, file, { contentType: mime, upsert: false })

  if (uploadError) return { ok: false, message: 'تعذّر رفع الصورة. أعد المحاولة.' }

  const { data: pub } = supabase.storage.from('course-images').getPublicUrl(path)

  const { data: old } = await supabase
    .from('courses')
    .select('thumbnail_url')
    .eq('id', courseId)
    .maybeSingle()

  const { error } = await supabase
    .from('courses')
    .update({ thumbnail_url: pub.publicUrl })
    .eq('id', courseId)

  if (error) {
    await supabase.storage.from('course-images').remove([path])
    return { ok: false, message: messageFor(toErrorCode(error)) }
  }

  // الصورة القديمة لم تعد مشارًا إليها، فبقاؤها تخزينٌ بلا فائدة
  const previous = old?.thumbnail_url
  if (previous) {
    const marker = '/course-images/'
    const at = previous.indexOf(marker)
    if (at !== -1) {
      await supabase.storage.from('course-images').remove([previous.slice(at + marker.length)])
    }
  }

  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/student', 'layout')
  revalidatePath('/')

  return { ok: true, message: 'تم حفظ صورة المقرر.' }
}

export async function removeCourseImage(courseId: string) {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: messageFor('FORBIDDEN') }

  const { data: course } = await supabase
    .from('courses')
    .select('thumbnail_url')
    .eq('id', courseId)
    .maybeSingle()

  const { error } = await supabase
    .from('courses')
    .update({ thumbnail_url: null })
    .eq('id', courseId)

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  const url = course?.thumbnail_url
  if (url) {
    const marker = '/course-images/'
    const at = url.indexOf(marker)
    if (at !== -1) {
      await supabase.storage.from('course-images').remove([url.slice(at + marker.length)])
    }
  }

  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/student', 'layout')
  revalidatePath('/')

  return { ok: true, message: 'حُذفت صورة المقرر.' }
}
