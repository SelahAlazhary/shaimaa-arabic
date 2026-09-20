import { z } from 'zod'

/**
 * معرّف يطابق ما تقبله PostgreSQL فعلًا.
 *
 * لماذا لا `z.uuid()`: في Zod 4 يتحقّق `uuid()` من **نسخة** المعرّف ونمطه
 * (الخانة 13 يجب أن تكون 1–8، والخانة 17 من 8/9/a/b) طبقًا لـRFC 4122.
 * بينما نوع `uuid` في PostgreSQL يقبل أي ٣٢ خانة سداسية بالتنسيق المعروف.
 *
 * النتيجة: معرّف مقبول في القاعدة ومرفوض في التطبيق — والطبقتان يجب أن
 * تتفقا، وإلا رفضت الواجهة بيانات موجودة فعلًا في القاعدة.
 *
 * `z.guid()` يتحقّق من التنسيق دون النسخة، فيطابق سلوك القاعدة تمامًا.
 */
export const uuidField = (message: string) => z.guid({ error: message })

export const optionalUuidField = (message: string) =>
  z.guid({ error: message }).or(z.literal(''))
