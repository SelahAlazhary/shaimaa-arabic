/**
 * ثوابت الرفع — ملف عادي لا 'use server'.
 * ملف الإجراءات لا يصدّر إلا دوال async؛ أي ثابت يُصدَّر منه يُسقط الصفحة كاملة.
 */

/** نفس قيد attachments_size_max في القاعدة وحدّ حاوية التخزين. */
export const MAX_FILE_BYTES = 100 * 1024 * 1024

export const ACCEPTED_UPLOAD_TYPES = 'application/pdf,image/jpeg,image/png'
