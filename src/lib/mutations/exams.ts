'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { uuidField, optionalUuidField } from '@/lib/validations/shared'
import { createClient } from '@/lib/supabase/server'
import { toErrorCode, messageFor } from '@/lib/errors'

export type ExamState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> }
  | { status: 'success'; message: string }

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '')

const fieldErrorsFrom = (issues: { path: PropertyKey[]; message: string }[]) => {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !out[key]) out[key] = issue.message
  }
  return out
}

const examSchema = z.object({
  courseId: optionalUuidField('اختر المقرر'),
  title: z.string({ error: 'العنوان مطلوب' }).trim().min(3, 'العنوان قصير جدًا').max(150, 'العنوان طويل جدًا'),
  description: z.string().trim().max(1000, 'الوصف طويل جدًا').optional().or(z.literal('')),
  durationMinutes: z.string().trim().regex(/^\d{1,3}$/, 'المدة بالدقائق من ١ إلى ٩٩٩').or(z.literal('')),
  passingPercentage: z.string().trim().regex(/^\d{1,3}$/, 'نسبة النجاح من ٠ إلى ١٠٠'),
  maxAttempts: z.string().trim().regex(/^\d{1,2}$/, 'عدد المحاولات من ١ إلى ٩٩').or(z.literal('')),
})

const questionCore = {
  questionText: z.string({ error: 'نص السؤال مطلوب' }).trim().min(3, 'السؤال قصير جدًا').max(1000, 'السؤال طويل جدًا'),
  questionType: z.enum(['single_choice', 'multiple_choice', 'true_false', 'short_answer'], {
    error: 'اختر نوع السؤال',
  }),
  points: z.string().trim().regex(/^\d{1,3}$/, 'الدرجة رقم من ١ إلى ٩٩٩'),
  correctText: z.string().trim().max(200, 'الإجابة طويلة جدًا').optional().or(z.literal('')),
  explanation: z.string().trim().max(500, 'الشرح طويل جدًا').optional().or(z.literal('')),
}

const questionSchema = z.object({ examId: uuidField('اختبار غير صحيح'), ...questionCore })
const questionUpdateSchema = z.object({ questionId: uuidField('سؤال غير صحيح'), ...questionCore })

type QuestionType = z.infer<typeof questionSchema>['questionType']

/** تحقّق الخيارات مشترك بين الإضافة والتعديل — منطق واحد لا نسختان (البند 27). */
function optionsProblem(
  type: QuestionType,
  correctText: string,
  options: string[],
  correctIndexes: Set<string>,
): ExamState | null {
  if (type === 'short_answer') {
    if (!correctText) {
      return { status: 'error', message: 'راجع البيانات المدخلة.', fieldErrors: { correctText: 'اكتب الإجابة الصحيحة' } }
    }
    return null
  }

  const filled = options.filter(Boolean)
  if (filled.length < 2) return { status: 'error', message: 'اكتب خيارين على الأقل.' }

  const correctCount = options.filter((o, i) => o && correctIndexes.has(String(i))).length
  if (correctCount === 0) return { status: 'error', message: 'حدّد الإجابة الصحيحة.' }
  if (type !== 'multiple_choice' && correctCount > 1) {
    return { status: 'error', message: 'هذا النوع يقبل إجابة صحيحة واحدة فقط.' }
  }
  return null
}

async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) return null
  return { supabase, userId: user.id }
}

type AdminCtx = NonNullable<Awaited<ReturnType<typeof adminClient>>>

/**
 * اختبار بدأه طالب واحد يصير سجلًّا لا مسوّدة.
 * تغيير النوع أو الدرجة أو الإجابة الصحيحة بعدها يجعل النتائج المحفوظة
 * تصف امتحانًا لم يعد موجودًا، وحذف السؤال يمحو إجابات الطلاب (CASCADE).
 * لذلك نقفل البنية ونُبقي تصحيح الصياغة مفتوحًا (البند 10).
 */
async function examIsLocked(ctx: AdminCtx, examId: string): Promise<boolean> {
  const { count } = await ctx.supabase
    .from('exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId)
  return (count ?? 0) > 0
}

const LOCKED_MESSAGE =
  'الاختبار بدأه طلاب بالفعل، فلا يمكن تغيير نوع السؤال أو درجته أو إجابته الصحيحة. التصحيح متاح لصياغة السؤال والخيارات فقط.'

export async function saveExam(_prev: ExamState, formData: FormData): Promise<ExamState> {
  const parsed = examSchema.safeParse({
    courseId: text(formData, 'courseId'),
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    durationMinutes: text(formData, 'durationMinutes'),
    passingPercentage: text(formData, 'passingPercentage'),
    maxAttempts: text(formData, 'maxAttempts'),
  })

  if (!parsed.success) {
    return { status: 'error', message: 'راجع البيانات المدخلة.', fieldErrors: fieldErrorsFrom(parsed.error.issues) }
  }

  const v = parsed.data
  const passing = Number(v.passingPercentage)
  if (passing > 100) {
    return { status: 'error', message: 'راجع البيانات المدخلة.', fieldErrors: { passingPercentage: 'النسبة لا تتجاوز ١٠٠' } }
  }

  const ctx = await adminClient()
  if (!ctx) return { status: 'error', message: messageFor('FORBIDDEN') }

  const payload = {
    course_id: v.courseId || null,
    title: v.title,
    description: v.description || null,
    duration_minutes: v.durationMinutes ? Number(v.durationMinutes) : null,
    passing_percentage: passing,
    max_attempts: v.maxAttempts ? Number(v.maxAttempts) : null,
    created_by: ctx.userId,
  }

  const id = text(formData, 'id')

  if (id) {
    const { error } = await ctx.supabase.from('exams').update(payload).eq('id', id)
    if (error) return { status: 'error', message: messageFor(toErrorCode(error)) }
    revalidatePath(`/admin/exams/${id}`)
    return { status: 'success', message: 'تم حفظ الاختبار.' }
  }

  const { data, error } = await ctx.supabase.from('exams').insert(payload).select('id').single()
  if (error || !data) return { status: 'error', message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/exams')
  redirect(`/admin/exams/${data.id}`)
}

/**
 * إضافة سؤال بخياراته في عملية واحدة.
 * الخيارات تُرسل كحقول متكرّرة `option` و`correct` (فهارس المختار).
 */
export async function addQuestion(_prev: ExamState, formData: FormData): Promise<ExamState> {
  const parsed = questionSchema.safeParse({
    examId: text(formData, 'examId'),
    questionText: text(formData, 'questionText'),
    questionType: text(formData, 'questionType'),
    points: text(formData, 'points'),
    correctText: text(formData, 'correctText'),
    explanation: text(formData, 'explanation'),
  })

  if (!parsed.success) {
    return { status: 'error', message: 'راجع البيانات المدخلة.', fieldErrors: fieldErrorsFrom(parsed.error.issues) }
  }

  const v = parsed.data
  const options = formData.getAll('option').map(String).map((s) => s.trim())
  const correctIndexes = new Set(formData.getAll('correct').map(String))

  const problem = optionsProblem(v.questionType, v.correctText ?? '', options, correctIndexes)
  if (problem) return problem

  const ctx = await adminClient()
  if (!ctx) return { status: 'error', message: messageFor('FORBIDDEN') }

  const { count } = await ctx.supabase
    .from('exam_questions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', v.examId)

  const { data: question, error } = await ctx.supabase
    .from('exam_questions')
    .insert({
      exam_id: v.examId,
      question_text: v.questionText,
      question_type: v.questionType,
      points: Number(v.points),
      correct_text: v.questionType === 'short_answer' ? v.correctText : null,
      explanation: v.explanation || null,
      sort_order: (count ?? 0) + 1,
    })
    .select('id')
    .single()

  if (error || !question) return { status: 'error', message: messageFor(toErrorCode(error)) }

  if (v.questionType !== 'short_answer') {
    const rows = options
      .map((option_text, i) => ({
        question_id: question.id,
        option_text,
        is_correct: correctIndexes.has(String(i)),
        sort_order: i + 1,
      }))
      .filter((r) => r.option_text)

    const { error: optError } = await ctx.supabase.from('question_options').insert(rows)

    if (optError) {
      // السؤال بلا خيارات لا معنى له — نُزيله حتى لا يبقى نصف سؤال
      await ctx.supabase.from('exam_questions').delete().eq('id', question.id)
      return { status: 'error', message: messageFor(toErrorCode(optError)) }
    }
  }

  revalidatePath(`/admin/exams/${v.examId}`)
  return { status: 'success', message: 'تمت إضافة السؤال.' }
}

/**
 * تعديل سؤال قائم.
 * ما دام الاختبار لم يبدأه أحد، السؤال يُستبدَل بالكامل (خياراته تُحذف وتُكتب من جديد).
 * وبعد أول محاولة، يُسمح بتصحيح النصوص فقط.
 */
export async function updateQuestion(_prev: ExamState, formData: FormData): Promise<ExamState> {
  const parsed = questionUpdateSchema.safeParse({
    questionId: text(formData, 'questionId'),
    questionText: text(formData, 'questionText'),
    questionType: text(formData, 'questionType'),
    points: text(formData, 'points'),
    correctText: text(formData, 'correctText'),
    explanation: text(formData, 'explanation'),
  })

  if (!parsed.success) {
    return { status: 'error', message: 'راجع البيانات المدخلة.', fieldErrors: fieldErrorsFrom(parsed.error.issues) }
  }

  const v = parsed.data
  const options = formData.getAll('option').map(String).map((s) => s.trim())
  const correctIndexes = new Set(formData.getAll('correct').map(String))

  const problem = optionsProblem(v.questionType, v.correctText ?? '', options, correctIndexes)
  if (problem) return problem

  const ctx = await adminClient()
  if (!ctx) return { status: 'error', message: messageFor('FORBIDDEN') }

  const { data: existing } = await ctx.supabase
    .from('exam_questions')
    .select('id, exam_id, question_type, points, correct_text, question_options(id, option_text, is_correct, sort_order)')
    .eq('id', v.questionId)
    .maybeSingle()

  if (!existing) return { status: 'error', message: messageFor('QUESTION_NOT_FOUND') }

  const examId = existing.exam_id
  const locked = await examIsLocked(ctx, examId)

  const current = [...(existing.question_options ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const filled = options.filter(Boolean)

  if (locked) {
    // التعديل المسموح: النص والشرح ونصوص الخيارات. أي شيء آخر يغيّر التصحيح.
    const structural =
      v.questionType !== existing.question_type ||
      Number(v.points) !== Number(existing.points) ||
      (v.questionType === 'short_answer'
        ? (v.correctText ?? '') !== (existing.correct_text ?? '')
        : filled.length !== current.length ||
          current.some((o, i) => o.is_correct !== correctIndexes.has(String(i))))

    if (structural) return { status: 'error', message: LOCKED_MESSAGE }

    const { error } = await ctx.supabase
      .from('exam_questions')
      .update({ question_text: v.questionText, explanation: v.explanation || null })
      .eq('id', v.questionId)

    if (error) return { status: 'error', message: messageFor(toErrorCode(error)) }

    // النصوص فقط، والهويّات كما هي حتى تبقى إجابات الطلاب مرتبطة بخياراتها
    for (const [i, option] of current.entries()) {
      const next = options[i]
      if (next && next !== option.option_text) {
        const { error: optError } = await ctx.supabase
          .from('question_options')
          .update({ option_text: next })
          .eq('id', option.id)
        if (optError) return { status: 'error', message: messageFor(toErrorCode(optError)) }
      }
    }

    revalidatePath(`/admin/exams/${examId}`)
    return { status: 'success', message: 'تم تصحيح صياغة السؤال.' }
  }

  const { error } = await ctx.supabase
    .from('exam_questions')
    .update({
      question_text: v.questionText,
      question_type: v.questionType,
      points: Number(v.points),
      correct_text: v.questionType === 'short_answer' ? v.correctText : null,
      explanation: v.explanation || null,
    })
    .eq('id', v.questionId)

  if (error) return { status: 'error', message: messageFor(toErrorCode(error)) }

  // لا محاولات، فلا شيء يشير إلى الخيارات القديمة: الاستبدال الكامل آمن هنا
  const { error: clearError } = await ctx.supabase
    .from('question_options')
    .delete()
    .eq('question_id', v.questionId)

  if (clearError) return { status: 'error', message: messageFor(toErrorCode(clearError)) }

  if (v.questionType !== 'short_answer') {
    const rows = options
      .map((option_text, i) => ({
        question_id: v.questionId,
        option_text,
        is_correct: correctIndexes.has(String(i)),
        sort_order: i + 1,
      }))
      .filter((r) => r.option_text)

    const { error: optError } = await ctx.supabase.from('question_options').insert(rows)
    if (optError) return { status: 'error', message: messageFor(toErrorCode(optError)) }
  }

  revalidatePath(`/admin/exams/${examId}`)
  return { status: 'success', message: 'تم حفظ السؤال.' }
}

/** الحذف يمحو معه إجابات الطلاب، فهو ممنوع بعد أول محاولة. */
export async function deleteQuestion(questionId: string) {
  const ctx = await adminClient()
  if (!ctx) return { ok: false, message: messageFor('FORBIDDEN') }

  const { data: question } = await ctx.supabase
    .from('exam_questions')
    .select('id, exam_id')
    .eq('id', questionId)
    .maybeSingle()

  if (!question) return { ok: false, message: messageFor('QUESTION_NOT_FOUND') }

  if (await examIsLocked(ctx, question.exam_id)) {
    return {
      ok: false,
      message:
        'لا يمكن حذف سؤال بعد أن بدأ طلاب الاختبار — حذفه يمحو إجاباتهم المسجَّلة. أخفي الاختبار وأنشئي نسخة جديدة بدلًا من ذلك.',
    }
  }

  const { error } = await ctx.supabase.from('exam_questions').delete().eq('id', questionId)
  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath(`/admin/exams/${question.exam_id}`)
  return { ok: true, message: 'تم حذف السؤال.' }
}

/** الترتيب لا يمسّ التصحيح، فهو مسموح حتى بعد بدء المحاولات. */
export async function moveQuestion(questionId: string, direction: 'up' | 'down') {
  const ctx = await adminClient()
  if (!ctx) return { ok: false, message: messageFor('FORBIDDEN') }

  const { data: question } = await ctx.supabase
    .from('exam_questions')
    .select('exam_id')
    .eq('id', questionId)
    .maybeSingle()

  if (!question) return { ok: false, message: messageFor('QUESTION_NOT_FOUND') }

  const { data, error } = await ctx.supabase.rpc('move_exam_question', {
    p_question: questionId,
    p_dir: direction,
  })

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath(`/admin/exams/${question.exam_id}`)
  // `false` تعني أن السؤال في طرف القائمة أصلًا — ليست فشلًا
  return { ok: true, message: data ? 'تم تغيير الترتيب.' : 'السؤال في طرف القائمة.' }
}

/** حذف اختبار: ممنوع بعد أول محاولة، لأن المحاولات تسقط معه (CASCADE). */
export async function deleteExam(examId: string) {
  const ctx = await adminClient()
  if (!ctx) return { ok: false, message: messageFor('FORBIDDEN') }

  if (await examIsLocked(ctx, examId)) {
    return {
      ok: false,
      message: 'لا يمكن حذف اختبار بدأه طلاب — الحذف يمحو محاولاتهم ونتائجهم. أخفيه بدل حذفه.',
    }
  }

  const { error } = await ctx.supabase.from('exams').delete().eq('id', examId)
  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath('/admin/exams')
  return { ok: true, message: 'تم حذف الاختبار.' }
}

/**
 * النشر يتطلب سؤالًا واحدًا على الأقل.
 * اختبار منشور بلا أسئلة يُظهر للطالب شاشة فارغة ويستهلك محاولة.
 */
export async function toggleExamPublished(examId: string, next: boolean) {
  const ctx = await adminClient()
  if (!ctx) return { ok: false, message: messageFor('FORBIDDEN') }

  if (next) {
    const { count } = await ctx.supabase
      .from('exam_questions')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', examId)

    if (!count) {
      return { ok: false, message: 'أضف سؤالًا واحدًا على الأقل قبل النشر.' }
    }
  }

  const { error } = await ctx.supabase
    .from('exams')
    .update({ is_published: next })
    .eq('id', examId)

  if (error) return { ok: false, message: messageFor(toErrorCode(error)) }

  revalidatePath(`/admin/exams/${examId}`)
  revalidatePath('/admin/exams')
  revalidatePath('/student', 'layout')

  return { ok: true, message: next ? 'تم نشر الاختبار.' : 'تم إخفاء الاختبار.' }
}
