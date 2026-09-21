'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { toErrorCode, messageFor } from '@/lib/errors'
import { MAX_FILE_BYTES } from '@/lib/constants/uploads'

export type UploadState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

const ALLOWED = {
  'application/pdf': { ext: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
} as const

type AllowedMime = keyof typeof ALLOWED

/**
 * التحقق من نوع الملف بالبايتات الأولى لا بالامتداد ولا بـtype الذي يرسله
 * المتصفح — كلاهما يتحكّم فيه المستخدم ويُزوَّر بسهولة (البند 39).
 */
async function sniff(file: File): Promise<AllowedMime | null> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer())

  for (const [mime, { magic }] of Object.entries(ALLOWED) as [AllowedMime, { magic: readonly number[] }][]) {
    if (magic.every((byte, i) => head[i] === byte)) return mime
  }
  return null
}

/** اسم تخزين آمن: لا يعتمد على اسم الملف الأصلي إطلاقًا. */
function storageName(ext: string): string {
  const id = crypto.randomUUID()
  const yyyymm = new Date().toISOString().slice(0, 7)
  return `${yyyymm}/${id}.${ext}`
}

export async function uploadAttachment(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const title = String(formData.get('title') ?? '').trim()
  const file = formData.get('file')
  const courseIds = formData.getAll('courseIds').map(String).filter(Boolean)

  if (!title || title.length < 2) {
    return { status: 'error', message: 'اكتب عنوانًا واضحًا للمرفق.' }
  }
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: 'اختر ملفًا أولًا.' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { status: 'error', message: 'الملف أكبر من ١٠٠ ميجابايت.' }
  }

  const mime = await sniff(file)
  if (!mime) {
    return {
      status: 'error',
      message: 'نوع الملف غير مدعوم. المسموح: PDF أو صورة JPG أو PNG.',
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: messageFor('UNAUTHORIZED') }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return { status: 'error', message: messageFor('FORBIDDEN') }
  }

  const path = storageName(ALLOWED[mime].ext)

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(path, file, { contentType: mime, upsert: false })

  if (uploadError) {
    return { status: 'error', message: 'تعذّر رفع الملف. أعد المحاولة.' }
  }

  const { data: row, error: insertError } = await supabase
    .from('attachments')
    .insert({
      title,
      // اسم العرض يُنظَّف: قد يحتوي مسارات أو محارف تكسر رأس التحميل
      file_name: file.name.replace(/[\\/\r\n"]+/g, '_').slice(0, 120),
      storage_path: path,
      mime_type: mime,
      file_size: file.size,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError || !row) {
    // الملف رُفع لكن السجل فشل: نحذف الملف حتى لا يبقى يتيمًا في التخزين
    await supabase.storage.from('attachments').remove([path])
    return { status: 'error', message: messageFor(toErrorCode(insertError)) }
  }

  if (courseIds.length > 0) {
    const { error: linkError } = await supabase
      .from('course_attachments')
      .insert(courseIds.map((course_id) => ({ course_id, attachment_id: row.id })))

    if (linkError) {
      return {
        status: 'error',
        message: 'رُفع الملف لكن تعذّر ربطه بالمقررات. اربطه يدويًا.',
      }
    }
  }

  revalidatePath('/admin/attachments')
  revalidatePath('/student', 'layout')

  return {
    status: 'success',
    message:
      courseIds.length > 0
        ? `تم رفع «${title}» وربطه بـ${courseIds.length} مقرر.`
        : `تم رفع «${title}». اربطه بمقرر ليظهر للطلاب.`,
  }
}

/**
 * حذف مرفق نهائيًا: الملف من التخزين أولًا ثم السجل.
 * الترتيب ليس تفصيلًا — سياسة قراءة التخزين تتحقّق من وجود صفّ في
 * `attachments` يطابق المسار، فحذف الصفّ أولًا يقطع عن المدير رؤية ملفه
 * ويترك الملف يتيمًا في التخزين بلا خطأ ظاهر.
 * وروابط المقررات تسقط مع الصفّ تلقائيًا (ON DELETE CASCADE).
 */
export async function deleteAttachment(attachmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: messageFor('UNAUTHORIZED') }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return { ok: false, message: messageFor('FORBIDDEN') }
  }

  const { data: row } = await supabase
    .from('attachments')
    .select('id, storage_path')
    .eq('id', attachmentId)
    .maybeSingle()

  if (!row) return { ok: false, message: 'لم نعثر على هذا الملف.' }

  const { data: removed, error: storageError } = await supabase.storage
    .from('attachments')
    .remove([row.storage_path])

  // لا نمسّ السجل إن بقي الملف: وجودهما معًا أسلم من سجلٍّ بلا ملف
  if (storageError || !removed || removed.length === 0) {
    return { ok: false, message: 'تعذّر حذف الملف من التخزين. أعد المحاولة.' }
  }

  const { error } = await supabase.from('attachments').delete().eq('id', attachmentId)
  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/attachments')
  revalidatePath('/student', 'layout')

  return { ok: true, message: 'تم حذف الملف.' }
}

/** فكّ ربط ملف عن مقرر: الملف يبقى ويُعاد ربطه بغيره. */
export async function unlinkAttachment(attachmentId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: messageFor('UNAUTHORIZED') }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return { ok: false, message: messageFor('FORBIDDEN') }
  }

  const { error } = await supabase
    .from('course_attachments')
    .delete()
    .eq('attachment_id', attachmentId)
    .eq('course_id', courseId)

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/attachments')
  revalidatePath('/student', 'layout')

  return { ok: true, message: 'تم فكّ الربط.' }
}

/** ربط ملف موجود بمقرر إضافي — مقابل فكّ الربط، حتى لا يكون الفكّ طريقًا بلا عودة. */
export async function linkAttachment(attachmentId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: messageFor('UNAUTHORIZED') }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return { ok: false, message: messageFor('FORBIDDEN') }
  }

  const { error } = await supabase
    .from('course_attachments')
    .upsert({ attachment_id: attachmentId, course_id: courseId })

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/attachments')
  revalidatePath('/student', 'layout')

  return { ok: true, message: 'تم ربط الملف بالمقرر.' }
}

/** ربط ملف بدرس بعينه — إلى جانب الربط بمقرر كامل. */
export async function linkAttachmentToLesson(attachmentId: string, lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: messageFor('UNAUTHORIZED') }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return { ok: false, message: messageFor('FORBIDDEN') }
  }

  const { error } = await supabase
    .from('lesson_attachments')
    .upsert({ attachment_id: attachmentId, lesson_id: lessonId })

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/attachments')
  revalidatePath('/student', 'layout')
  return { ok: true, message: 'تم ربط الملف بالدرس.' }
}

export async function unlinkAttachmentFromLesson(attachmentId: string, lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: messageFor('UNAUTHORIZED') }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    return { ok: false, message: messageFor('FORBIDDEN') }
  }

  const { error } = await supabase
    .from('lesson_attachments')
    .delete()
    .eq('attachment_id', attachmentId)
    .eq('lesson_id', lessonId)

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/attachments')
  revalidatePath('/student', 'layout')
  return { ok: true, message: 'تم فكّ الربط عن الدرس.' }
}
