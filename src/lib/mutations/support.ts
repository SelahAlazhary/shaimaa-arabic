'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toErrorCode, messageFor } from '@/lib/errors'
import { TICKET_TYPES, type TicketType } from '@/lib/support/labels'

export type SupportState = { status: 'idle' } | { status: 'error'; message: string }

/** فتح محادثة جديدة مع الدعم. الرسالة الأولى جزء من نفس الإجراء. */
export async function openTicket(_prev: SupportState, formData: FormData): Promise<SupportState> {
  const type = String(formData.get('type') ?? '')
  const message = String(formData.get('message') ?? '').trim()

  if (!TICKET_TYPES.includes(type as TicketType)) {
    return { status: 'error', message: 'اختر نوع المساعدة المطلوبة.' }
  }
  if (message.length < 5) {
    return { status: 'error', message: 'اكتب رسالتك بتفصيل أوضح (٥ أحرف على الأقل).' }
  }
  if (message.length > 2000) {
    return { status: 'error', message: 'الرسالة طويلة جدًا. اختصرها في ٢٠٠٠ حرف.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: messageFor('UNAUTHORIZED') }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({ student_id: user.id, type: type as TicketType })
    .select('id')
    .single()

  if (error || !ticket) {
    return { status: 'error', message: messageFor(toErrorCode(error)) }
  }

  const { error: msgError } = await supabase
    .from('support_messages')
    .insert({ ticket_id: ticket.id, sender_id: user.id, message })

  if (msgError) {
    return { status: 'error', message: messageFor(toErrorCode(msgError)) }
  }

  revalidatePath('/student/support')
  redirect(`/student/support/${ticket.id}`)
}

/** إرسال رسالة داخل محادثة قائمة. RLS تمنع الكتابة في محادثة غير مملوكة. */
export async function sendMessage(_prev: SupportState, formData: FormData): Promise<SupportState> {
  const ticketId = String(formData.get('ticketId') ?? '')
  const message = String(formData.get('message') ?? '').trim()

  if (!ticketId) return { status: 'error', message: messageFor('TICKET_NOT_FOUND') }
  if (!message) return { status: 'error', message: 'اكتب رسالتك أولًا.' }
  if (message.length > 2000) {
    return { status: 'error', message: 'الرسالة طويلة جدًا. اختصرها في ٢٠٠٠ حرف.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: messageFor('UNAUTHORIZED') }

  const { error } = await supabase
    .from('support_messages')
    .insert({ ticket_id: ticketId, sender_id: user.id, message })

  if (error) {
    return { status: 'error', message: messageFor(toErrorCode(error)) }
  }

  revalidatePath(`/student/support/${ticketId}`)
  return { status: 'idle' }
}
