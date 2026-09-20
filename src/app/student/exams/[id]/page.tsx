import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Timer, Target, Repeat2 } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { ExamRunner } from '@/components/student/exam-runner'
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

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStudent()
  const { id } = await params
  const supabase = await createClient()

  // RLS تُرجع null لاختبار غير منشور أو لمقرر غير مشترك فيه
  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, description, duration_minutes, passing_percentage, max_attempts')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()

  if (!exam) notFound()

  return (
    <div className="space-y-5">
      <Link
        href="/student/exams"
        className="inline-flex items-center gap-1.5 text-base text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        كل الاختبارات
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-ink sm:text-xl">{exam.title}</h1>
        {exam.description && (
          <p className="mt-1.5 text-base leading-relaxed text-ink-muted">{exam.description}</p>
        )}

        <ul className="nums-ar mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-faint">
          <li className="flex items-center gap-1.5">
            <Timer className="size-3.5" aria-hidden />
            {exam.duration_minutes
              ? `${formatNumber(exam.duration_minutes)} دقيقة`
              : 'بدون مؤقّت'}
          </li>
          <li className="flex items-center gap-1.5">
            <Target className="size-3.5" aria-hidden />
            النجاح {formatNumber(Math.round(exam.passing_percentage))}٪
          </li>
          <li className="flex items-center gap-1.5">
            <Repeat2 className="size-3.5" aria-hidden />
            {exam.max_attempts
              ? `${formatNumber(exam.max_attempts)} محاولة`
              : 'محاولات غير محدودة'}
          </li>
        </ul>
      </div>

      <ExamRunner
        examId={exam.id}
        examTitle={exam.title}
        hasTimer={Boolean(exam.duration_minutes)}
      />
    </div>
  )
}
