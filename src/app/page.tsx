import type { Metadata } from 'next'
import Link from 'next/link'
import {
  PlayCircle,
  FileText,
  ClipboardCheck,
  Radio,
  Ticket,
  UserPlus,
  GraduationCap,
  Timer,
  ListChecks,
  Repeat2,
  Download,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  LifeBuoy,
} from 'lucide-react'
import { Navbar } from '@/components/site/navbar'
import { HeroSection } from '@/components/site/hero-section'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'منصة الأستاذة الشيماء أحمد — اللغة العربية',
  description:
    'شرح اللغة العربية للمرحلتين الإعدادية والثانوية: دروس بالفيديو، ملازم، اختبارات مصحّحة، وحصص مباشرة. تابع تقدّمك في كل درس.',
  openGraph: {
    title: 'منصة الأستاذة الشيماء أحمد — اللغة العربية',
    description:
      'دروس بالفيديو وملازم واختبارات وحصص مباشرة، للمرحلتين الإعدادية والثانوية.',
    locale: 'ar_EG',
    type: 'website',
  },
}

/** الصفحة العامة تُبنى مرة كل ساعة: محتواها مرجعي لا شخصي. */
export const revalidate = 3600

/**
 * علامة المنصة: كتاب مفتوح تعلوه ورقة.
 * مرسومة لا صورة، فتبقى حادّة في كل مقاس وتتلوّن مع السياق.
 */
const FEATURES = [
  {
    icon: PlayCircle,
    title: 'دروس بالفيديو',
    body: 'كل درس مشروح خطوة بخطوة، تعيده متى شئت، والمنصة تحفظ لك آخر نقطة وقفت عندها.',
  },
  {
    icon: FileText,
    title: 'ملازم ومذكرات',
    body: 'ملفات PDF مرتبطة بكل كورس، تحمّلها على جهازك وتذاكر منها بلا إنترنت.',
  },
  {
    icon: ClipboardCheck,
    title: 'اختبارات مصحّحة',
    body: 'تُصحَّح فور التسليم وتظهر لك نتيجتك ودرجتك في كل سؤال — بلا انتظار.',
  },
  {
    icon: Radio,
    title: 'حصص مباشرة',
    body: 'مراجعات وحصص بث مباشر، ومن فاتته الحصة يجد تسجيلها في حسابه.',
  },
]

const EXAM_POINTS = [
  {
    icon: ClipboardCheck,
    title: 'تصحيح فوري',
    body: 'النتيجة والدرجة في كل سؤال تظهر لحظة التسليم.',
  },
  {
    icon: Timer,
    title: 'مؤقّت لا يُخدَع',
    body: 'الوقت محسوب على الخادم، فلا يزيد بإعادة فتح الصفحة.',
  },
  {
    icon: ListChecks,
    title: 'مراجعة الإجابات',
    body: 'ترى أين أخطأت، والإجابة الصحيحة مع شرحها.',
  },
  {
    icon: Repeat2,
    title: 'محاولات معلومة',
    body: 'عدد المحاولات مكتوب قبل أن تبدأ، لا مفاجآت.',
  },
] as const

const FILE_POINTS = [
  {
    icon: FileText,
    title: 'مرتبطة بالكورس',
    body: 'كل ملف في مكانه تحت الكورس الذي يخصّه.',
  },
  {
    icon: Download,
    title: 'تحميل للمذاكرة',
    body: 'حمّلها مرة وذاكر منها بلا إنترنت.',
  },
  {
    icon: ShieldCheck,
    title: 'لمشتركي الكورس',
    body: 'روابط مؤقّتة لا تُشارَك ولا تُفتح من خارج حسابك.',
  },
  {
    icon: RefreshCw,
    title: 'تتحدّث أولًا بأول',
    body: 'الإضافات الجديدة تظهر في حسابك فور رفعها.',
  },
] as const

const SUPPORT_POINTS = [
  {
    icon: MessageCircle,
    title: 'سؤال في المنهج',
    body: 'اسأل عن قاعدة أو نص لم يتّضح، ويصلك الرد في حسابك.',
  },
  {
    icon: Ticket,
    title: 'مشكلة اشتراك',
    body: 'كود لم يُفعَّل أو كورس لم يظهر — أبلغنا وتُحلّ.',
  },
  {
    icon: LifeBuoy,
    title: 'مشكلة تقنية',
    body: 'فيديو لا يعمل أو ملف لا يفتح، صف ما حدث ونتابعه.',
  },
] as const

const STEPS = [
  {
    icon: UserPlus,
    title: 'أنشئ حسابك',
    body: 'بياناتك الأساسية ومرحلتك الدراسية، في دقيقة واحدة.',
  },
  {
    icon: Ticket,
    title: 'فعّل كود الاشتراك',
    body: 'اكتب الكود الذي حصلت عليه، ويُفتح الكورس على حسابك فورًا.',
  },
  {
    icon: GraduationCap,
    title: 'ابدأ المذاكرة',
    body: 'الدروس والملازم والاختبارات كلها في مكان واحد، ومتابعة لتقدّمك.',
  },
]

export default async function LandingPage() {
  const supabase = await createClient()

  // بيانات حقيقية لا أرقام مكتوبة يدويًا. RLS تتيحها للزوار.
  const [stagesRes, gradesRes, coursesRes] = await Promise.all([
    supabase.from('education_stages').select('id, name_ar').eq('is_visible', true).order('sort_order'),
    supabase.from('grades').select('id, name_ar, stage_id').eq('is_visible', true).order('sort_order'),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ])

  const stages = stagesRes.data ?? []
  const grades = gradesRes.data ?? []
  const publishedCourses = coursesRes.count ?? 0

  return (
    <div className="min-h-dvh bg-canvas">
      <Navbar />

      <main>
        <HeroSection />

        {/* ما تحصل عليه */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="mx-auto max-w-7xl scroll-mt-16 lg:scroll-mt-20 px-5 py-12 sm:px-8 sm:py-16"
        >
          <h2 id="features-title" className="text-xl font-semibold text-ink sm:text-2xl">
            ما تجده في حسابك
          </h2>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5"
              >
                <span className="mb-3 grid size-9 place-items-center rounded-[var(--radius-field)] bg-brand-50 text-brand-700">
                  <Icon className="size-[1.125rem]" aria-hidden />
                </span>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* الصفوف — من قاعدة البيانات لا قائمة ثابتة */}
        {stages.length > 0 && (
          <section
            id="courses"
            aria-labelledby="stages-title"
            className="scroll-mt-16 lg:scroll-mt-20 border-y border-border-subtle bg-surface"
          >
            <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14">
              <h2 id="stages-title" className="text-xl font-semibold text-ink sm:text-2xl">
                المقررات والصفوف
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                كل صف له مقرره الخاص: نحو وبلاغة وأدب ونصوص، مقسّمة وحدات ودروسًا
                بالترتيب الذي تُدرَّس به في المدرسة.
                {publishedCourses > 0 && (
                  <span className="nums-ar"> {formatNumber(publishedCourses)} كورس متاح الآن.</span>
                )}
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {stages.map((s) => {
                  const stageGrades = grades.filter((g) => g.stage_id === s.id)
                  if (stageGrades.length === 0) return null

                  return (
                    <div key={s.id}>
                      <h3 className="text-sm font-semibold text-ink">{s.name_ar}</h3>
                      <ul className="mt-2.5 flex flex-wrap gap-2">
                        {stageGrades.map((g) => (
                          <li
                            key={g.id}
                            className="rounded-[var(--radius-pill)] bg-surface-muted px-3 py-1 text-sm text-ink-muted"
                          >
                            {g.name_ar}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* الاختبارات · الملفات · الدعم — أقسام يقصدها الرأس فعلًا */}
        <section
          id="exams"
          aria-labelledby="exams-title"
          className="mx-auto max-w-7xl scroll-mt-16 lg:scroll-mt-20 px-5 py-12 sm:px-8 sm:py-16"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="flex items-center gap-3 text-sm font-medium text-accent">
                الاختبارات
                <span className="h-px w-12 bg-accent-soft" aria-hidden />
              </p>
              <h2 id="exams-title" className="mt-3 text-xl font-semibold text-ink sm:text-2xl">
                تعرف درجتك لحظة ما تسلّم
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
                الاختبار يُصحَّح فور التسليم، وتظهر لك درجتك في كل سؤال، والإجابة
                الصحيحة مع شرحها. المؤقّت يُحسب على ساعة الخادم لا ساعة جهازك، فلا
                يتأثر بإغلاق الصفحة أو انقطاع الإنترنت.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {EXAM_POINTS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4"
                >
                  <Icon className="mb-2.5 size-[1.125rem] text-brand-600" aria-hidden />
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="files"
          aria-labelledby="files-title"
          className="scroll-mt-16 lg:scroll-mt-20 border-y border-border-subtle bg-surface"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="flex items-center gap-3 text-sm font-medium text-accent">
                الملفات
                <span className="h-px w-12 bg-accent-soft" aria-hidden />
              </p>
              <h2 id="files-title" className="mt-3 text-xl font-semibold text-ink sm:text-2xl">
                ملازم تحمّلها وتذاكر منها
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
                لكل كورس ملفاته: ملازم ومذكرات وأوراق تطبيقات بصيغة PDF. تفتحها من
                حسابك وتحمّلها على جهازك لتذاكر منها بلا إنترنت.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {FILE_POINTS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted p-4"
                >
                  <Icon className="mb-2.5 size-[1.125rem] text-brand-600" aria-hidden />
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="support"
          aria-labelledby="support-title"
          className="mx-auto max-w-7xl scroll-mt-16 lg:scroll-mt-20 px-5 py-12 sm:px-8 sm:py-16"
        >
          <p className="flex items-center gap-3 text-sm font-medium text-accent">
            الدعم
            <span className="h-px w-12 bg-accent-soft" aria-hidden />
          </p>
          <h2 id="support-title" className="mt-3 text-xl font-semibold text-ink sm:text-2xl">
            سؤالك لا يضيع
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
            داخل حسابك محادثة دعم مباشرة. تكتب سؤالك وتتابع الرد عليه في نفس المكان،
            وتعرف حالة طلبك في كل خطوة.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {SUPPORT_POINTS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5"
              >
                <Icon className="mb-2.5 size-[1.125rem] text-brand-600" aria-hidden />
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* كيف تبدأ */}
        <section
          id="steps"
          aria-labelledby="steps-title"
          className="mx-auto max-w-7xl scroll-mt-16 lg:scroll-mt-20 px-5 py-12 sm:px-8 sm:py-16"
        >
          <h2 id="steps-title" className="text-xl font-semibold text-ink sm:text-2xl">
            كيف تبدأ
          </h2>

          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-5"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="nums-ar grid size-7 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-ink-invert">
                    {formatNumber(i + 1)}
                  </span>
                  <Icon className="size-4 text-ink-faint" aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-[var(--radius-panel)] bg-brand-700 px-6 py-8 text-center sm:px-8">
            <h2 className="text-lg font-semibold text-ink-invert sm:text-xl">
              حسابك جاهز في دقيقة
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-100">
              أنشئ حسابك الآن، وفعّل كود الاشتراك متى حصلت عليه.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex h-12 items-center rounded-[var(--radius-field)] bg-surface px-6 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              إنشاء حساب
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <p className="nums-ar text-xs text-ink-faint">
            © {formatNumber(new Date().getFullYear())} منصة الأستاذة الشيماء أحمد
          </p>
          <nav aria-label="روابط" className="flex gap-4 text-xs text-ink-muted">
            <Link href="/login" className="underline-offset-4 hover:underline">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="underline-offset-4 hover:underline">
              إنشاء حساب
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
