import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ClipboardList, ListChecks, Plus, Lock } from 'lucide-react'
import { requireAdminPage } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ExamForm, ExamPublishToggle } from '@/components/admin/exam-form'
import { QuestionForm, type QuestionDefaults } from '@/components/admin/question-form'
import { QuestionList } from '@/components/admin/question-list'
import { formatNumber } from '@/lib/utils/format'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('exams').select('title').eq('id', id).maybeSingle()
  return { title: data?.title ?? 'الاختبار' }
}

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage('exams')
  const { id } = await params
  const supabase = await createClient()

  const [examRes, coursesRes, questionsRes, optionsRes, attemptsRes] = await Promise.all([
    supabase
      .from('exams')
      .select(
        'id, course_id, lesson_id, title, description, duration_minutes, passing_percentage, max_attempts, is_published, lessons(id, title, course_id)',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('courses').select('id, title').order('title'),
    supabase
      .from('exam_questions')
      .select('id, question_text, question_type, points, correct_text, explanation, sort_order')
      .eq('exam_id', id)
      .order('sort_order'),
    supabase.from('question_options').select('id, question_id, option_text, is_correct, sort_order'),
    supabase.from('exam_attempts').select('id', { count: 'exact', head: true }).eq('exam_id', id),
  ])

  const exam = examRes.data
  if (!exam) notFound()

  // الواجب اختبار مربوط بدرس: الرجوع يكون إلى درسه لا إلى قائمة الاختبارات
  const lesson = exam.lessons as { id: string; title: string; course_id: string } | null

  const options = optionsRes.data ?? []
  const attempts = attemptsRes.count ?? 0
  // محاولة واحدة تكفي لتجميد بنية الأسئلة: النتائج المسجَّلة تصير مرجعًا
  const locked = attempts > 0

  const questions: QuestionDefaults[] = (questionsRes.data ?? []).map((q) => ({
    id: q.id,
    questionText: q.question_text,
    questionType: q.question_type,
    points: String(Math.round(Number(q.points))),
    correctText: q.correct_text ?? '',
    explanation: q.explanation ?? '',
    options: options
      .filter((o) => o.question_id === q.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ text: o.option_text, isCorrect: o.is_correct })),
  }))

  const totalPoints = questions.reduce((s, q) => s + Number(q.points), 0)

  return (
    <div className="space-y-6">
      <Link
        href={lesson ? `/admin/courses/${lesson.course_id}` : '/admin/exams'}
        className="inline-flex items-center gap-1.5 text-base text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        {lesson ? `الرجوع إلى المقرر` : 'كل الاختبارات'}
      </Link>

      {lesson && (
        <p className="flex items-center gap-2 rounded-[var(--radius-card)] bg-info-bg px-4 py-3 text-base text-info">
          <ClipboardList className="size-4 shrink-0" aria-hidden />
          هذا واجب على درس «{lesson.title}» — يظهر للطالب أسفل الدرس بعد نشره.
        </p>
      )}

      <PageHeader
        title={exam.title}
        description={`${formatNumber(questions.length)} سؤال · مجموع الدرجات ${formatNumber(totalPoints)} · ${formatNumber(attempts)} محاولة`}
        action={<ExamPublishToggle examId={exam.id} published={exam.is_published} />}
      />

      {!exam.is_published && questions.length === 0 && (
        <p className="rounded-[var(--radius-card)] bg-warning-bg px-4 py-3 text-base text-warning">
          أضف سؤالًا واحدًا على الأقل قبل النشر — الاختبار الفارغ يستهلك محاولة الطالب بلا فائدة.
        </p>
      )}

      <Card>
        <CardHeader title="إعدادات الاختبار" icon={ClipboardList} />
        <ExamForm
          courses={coursesRes.data ?? []}
          defaults={{
            id: exam.id,
            courseId: exam.course_id ?? '',
            title: exam.title,
            description: exam.description ?? '',
            durationMinutes: exam.duration_minutes ? String(exam.duration_minutes) : '',
            passingPercentage: String(Math.round(Number(exam.passing_percentage))),
            maxAttempts: exam.max_attempts ? String(exam.max_attempts) : '',
          }}
        />
      </Card>

      {locked ? (
        <p className="flex items-start gap-2 rounded-[var(--radius-card)] bg-warning-bg px-4 py-3 text-base leading-relaxed text-warning">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          بدأ {formatNumber(attempts)} طالب هذا الاختبار، فإضافة سؤال جديد تغيّر مجموع الدرجات
          وتجعل النتائج المسجَّلة غير قابلة للمقارنة. التصحيح متاح لصياغة الأسئلة الحالية.
        </p>
      ) : (
        <Card>
          <CardHeader title="إضافة سؤال" icon={Plus} />
          <QuestionForm examId={exam.id} />
        </Card>
      )}

      <Card>
        <CardHeader
          title="أسئلة الاختبار"
          icon={ListChecks}
          action={
            <span className="nums-ar text-sm text-ink-faint">
              {formatNumber(questions.length)} سؤال
            </span>
          }
        />

        <QuestionList examId={exam.id} questions={questions} locked={locked} />
      </Card>
    </div>
  )
}
