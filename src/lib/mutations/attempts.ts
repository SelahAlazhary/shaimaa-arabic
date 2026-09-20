'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { toErrorCode, messageFor } from '@/lib/errors'

export type StartState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'started'; attemptId: string; expiresAt: string | null; serverNow: string }

export type SubmitResult =
  | { status: 'error'; message: string }
  | {
      status: 'done'
      score: number
      maxScore: number
      percentage: number
      passed: boolean
    }

/**
 * بدء محاولة.
 * كل الفحوص داخل start_exam_attempt في القاعدة: النشر، الاشتراك، النافذة
 * الزمنية، وحد المحاولات. لا يُكرَّر منها شيء هنا (القاعدة 4).
 */
export async function startAttempt(examId: string): Promise<StartState> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('start_exam_attempt', { p_exam: examId })

  if (error) return { status: 'error', message: messageFor(toErrorCode(error)) }

  const result = data as unknown as {
    attempt_id: string
    expires_at: string | null
    server_now: string
  }

  return {
    status: 'started',
    attemptId: result.attempt_id,
    expiresAt: result.expires_at,
    serverNow: result.server_now,
  }
}

export type AttemptQuestion = {
  id: string
  question_text: string
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer'
  points: number
  options: { id: string; option_text: string }[]
}

export type AttemptPayload = {
  attemptId: string
  expiresAt: string | null
  serverNow: string
  questions: AttemptQuestion[]
}

/** الأسئلة تأتي من الدالة وحدها — بلا is_correct ولا correct_text (البند 19). */
export async function getAttemptQuestions(
  attemptId: string,
): Promise<{ ok: true; payload: AttemptPayload } | { ok: false; message: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_exam_attempt_questions', { p_attempt: attemptId })

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  const result = data as unknown as {
    attempt_id: string
    expires_at: string | null
    server_now: string
    questions: AttemptQuestion[]
  }

  return {
    ok: true,
    payload: {
      attemptId: result.attempt_id,
      expiresAt: result.expires_at,
      serverNow: result.server_now,
      questions: result.questions ?? [],
    },
  }
}

/**
 * التسليم.
 * التصحيح كله في القاعدة. الواجهة ترسل الإجابات وتعرض النتيجة العائدة،
 * ولا تحسب درجة واحدة بنفسها (البند 19).
 */
export async function submitAttempt(
  attemptId: string,
  answers: { question_id: string; option_ids?: string[]; answer_text?: string }[],
): Promise<SubmitResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('submit_exam', {
    p_attempt: attemptId,
    p_answers: answers,
  })

  if (error) return { status: 'error', message: messageFor(toErrorCode(error)) }

  const r = data as unknown as {
    score: number
    max_score: number
    percentage: number
    passed: boolean
  }

  revalidatePath('/student/exams')
  revalidatePath('/student', 'layout')

  return {
    status: 'done',
    score: Number(r.score),
    maxScore: Number(r.max_score),
    percentage: Number(r.percentage),
    passed: r.passed,
  }
}
