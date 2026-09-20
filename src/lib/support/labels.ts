/**
 * تسميات الدعم — ملف عادي لا 'use server'.
 * ملف الإجراءات لا يستطيع تصدير غير دوال async، فالثوابت تعيش هنا
 * ليستوردها الخادم والعميل معًا.
 */

export const TICKET_TYPES = [
  'curriculum_question',
  'subscription_problem',
  'technical_problem',
  'other',
] as const

export type TicketType = (typeof TICKET_TYPES)[number]

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  curriculum_question: 'سؤال في المنهج',
  subscription_problem: 'مشكلة في الاشتراك',
  technical_problem: 'مشكلة تقنية',
  other: 'موضوع آخر',
}

export const TICKET_STATUS_LABELS = {
  open: 'مفتوحة',
  pending: 'قيد المتابعة',
  resolved: 'تم الحل',
  closed: 'مغلقة',
} as const

export type TicketStatus = keyof typeof TICKET_STATUS_LABELS
