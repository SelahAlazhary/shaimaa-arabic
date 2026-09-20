import { createClient } from '@/lib/supabase/server'

export type ReviewQuestion = {
  id: string
  question_text: string
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer'
  points: number
  explanation: string | null
  earned: number
  is_correct: boolean
  answer_text: string | null
  correct_text: string | null
  chosen_ids: string[]
  options: { id: string; option_text: string; is_correct: boolean }[]
}

export type AttemptReview = {
  examTitle: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  submittedAt: string
  questions: ReviewQuestion[]
}

/**
 * مراجعة محاولة.
 * الدالة في القاعدة ترفض أي محاولة غير مُسلَّمة أو ليست للطالب — لا فحص هنا.
 */
export async function getAttemptReview(attemptId: string): Promise<AttemptReview | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_exam_attempt_review', { p_attempt: attemptId })

  if (error || !data) return null

  const r = data as unknown as {
    exam_title: string
    score: number
    max_score: number
    percentage: number
    passed: boolean
    submitted_at: string
    questions: ReviewQuestion[]
  }

  return {
    examTitle: r.exam_title,
    score: Number(r.score),
    maxScore: Number(r.max_score),
    percentage: Number(r.percentage),
    passed: r.passed,
    submittedAt: r.submitted_at,
    questions: r.questions ?? [],
  }
}
