import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  PlayCircle,
  FileText,
  ClipboardCheck,
  Radio,
  Ticket,
  UserPlus,
  GraduationCap,
  ArrowLeft,
  BookOpen,
  LogIn,
  Timer,
  ListChecks,
  Repeat2,
  Download,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  LifeBuoy,
} from 'lucide-react'
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
function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-9 shrink-0 text-accent-soft" fill="none" aria-hidden>
      {/* كتاب مفتوح تعلوه ورقة — مرسوم لا صورة، فيبقى حادًّا في كل مقاس */}
      <path
        d="M4 9.5c3.5-1.3 7-1.3 10.5 0v15c-3.5-1.3-7-1.3-10.5 0v-15Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M28 9.5c-3.5-1.3-7-1.3-10.5 0v15c3.5-1.3 7-1.3 10.5 0v-15Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 8.2c1.1-2.4 3-3.8 5.6-4.2-.2 2.8-1.5 4.7-3.9 5.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 9.2v16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

/** روابط الرأس تشير إلى أقسام هذه الصفحة نفسها — لا رابط يقود إلى لا شيء. */
const SECTIONS = [
  { href: '#top', label: 'الرئيسية' },
  { href: '#courses', label: 'المقررات' },
  { href: '#exams', label: 'الاختبارات' },
  { href: '#files', label: 'الملفات' },
  { href: '#support', label: 'الدعم' },
] as const

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
      <header className="sticky top-0 z-40 bg-brand-800 text-ink-invert">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">
                الأستاذة الشيماء أحمد
              </span>
              <span className="block truncate text-[0.7rem] leading-tight text-accent-soft">
                اللغة العربية · رحلتك نحو مستقبل أفضل
              </span>
            </span>
          </Link>

          {/* روابط إلى أقسام موجودة فعلًا في هذه الصفحة لا إلى صفحات مغلقة */}
          <nav aria-label="أقسام الصفحة" className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={i === 0 ? 'page' : undefined}
                className={
                  i === 0
                    ? 'relative px-3.5 py-2 text-sm font-medium text-ink-invert after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent-soft'
                    : 'px-3.5 py-2 text-sm text-brand-100 transition-colors hover:text-ink-invert'
                }
              >
                {item.label}
              </a>
            ))}
          </nav>

          <nav aria-label="الحساب" className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              aria-label="تسجيل الدخول"
              className="inline-flex size-10 items-center justify-center gap-2 rounded-[var(--radius-field)] border border-brand-500 text-sm font-medium text-ink-invert transition-colors hover:bg-brand-700 sm:w-auto sm:px-3.5"
            >
              <span className="hidden sm:inline">تسجيل الدخول</span>
              <LogIn className="size-4 shrink-0" aria-hidden />
            </Link>
            <Link
              href="/register"
              aria-label="إنشاء حساب"
              className="inline-flex size-10 items-center justify-center gap-2 rounded-[var(--radius-field)] bg-accent text-sm font-semibold text-brand-900 transition-colors hover:bg-accent-soft sm:w-auto sm:px-4"
            >
              <span className="hidden sm:inline">إنشاء حساب</span>
              <UserPlus className="size-4 shrink-0" aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* الواجهة: وعد واحد واضح وإجراء واحد أساسي */}
        <section className="relative overflow-hidden bg-parchment">
          {/* زخرفة هندسية: دوائر متشابكة، أساس النقش العربي */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full text-brand-700 opacity-[0.055]"
          >
            <defs>
              <pattern id="arabesque" width="56" height="56" patternUnits="userSpaceOnUse">
                <circle cx="0" cy="28" r="19.8" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="56" cy="28" r="19.8" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="28" cy="0" r="19.8" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="28" cy="56" r="19.8" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#arabesque)" />
          </svg>

          {/* حروف عربية ضخمة عند الحافة — الموضوع نفسه يصير زخرفة */}
          <p
            aria-hidden
            className="pointer-events-none absolute -start-4 top-1/2 hidden -translate-y-1/2 select-none flex-col text-[8rem] font-bold leading-[0.8] text-brand-700 opacity-[0.07] lg:flex"
          >
            <span>ض</span>
            <span>ق</span>
            <span>ع</span>
            <span>ب</span>
          </p>

          {/*
           * لوحة الصورة تملأ الحافة اليسرى. حدّها الأيمن قوسٌ واحد:
           * نصف قطر الزاوية العليا اليمنى ١٠٠٪ أفقيًا ورأسيًا يرسم ربع دائرة
           * تبدأ من أعلى اللوحة وتنتهي عند أسفل حافّتها — ضيّقة أعلى، واسعة أسفل.
           */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 end-0 hidden w-[48%] lg:block"
          >
            <div className="absolute inset-0 overflow-hidden [border-radius:0_100%_0_0/0_100%_0_0]">
              {/* خلفية ناعمة تحت الصورة المقصوصة بدل بياض مسطّح */}
              <span className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_15%,var(--color-surface)_0%,var(--color-surface)_45%,var(--color-brand-50)_100%)]" />
              <Image
                src="/brand/teacher.webp"
                alt=""
                fill
                priority
                quality={90}
                sizes="(min-width: 1024px) 48vw, 0px"
                className="object-contain object-[62%_bottom]"
              />
            </div>

            {/* خطّ ذهبي رفيع يتتبّع القوس نفسه، مُزاحًا للخارج قليلًا */}
            <span className="absolute -bottom-px -end-7 -top-7 start-0 border-e-2 border-t-2 border-accent-soft [border-radius:0_100%_0_0/0_100%_0_0]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-20">
            {/* الصورة على الشاشات الصغيرة: بديل مستقلّ عن لوحة القوس */}
            <div
              className="rise-in relative mx-auto mb-8 aspect-square w-56 overflow-hidden rounded-[var(--radius-panel)] border border-accent-soft bg-surface sm:w-64 lg:hidden"
              aria-hidden
            >
              <Image
                src="/brand/teacher.webp"
                alt=""
                fill
                priority
                quality={90}
                sizes="(min-width: 640px) 16rem, 14rem"
                className="object-contain object-bottom"
              />
            </div>

            <div className="rise-in lg:w-[52%]">
              <p className="flex items-center gap-3 text-sm font-medium tracking-wide text-accent">
                <span className="h-px flex-1 bg-accent-soft/70 lg:hidden" aria-hidden />
                منصتك التعليمية
                <span className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-px w-14 bg-accent-soft" />
                  <span className="size-1.5 rotate-45 bg-accent-soft" />
                  <span className="h-px w-5 bg-accent-soft" />
                </span>
              </p>

              <h1 className="mt-5 text-[1.75rem] font-bold leading-[1.25] text-brand-700 sm:text-4xl lg:text-[2.75rem]">
                اللغة العربية، مشروحة بترتيب
                <br className="hidden sm:block" /> يوصلك للدرجة النهائية.
              </h1>

              <p className="mt-5 text-base leading-relaxed text-ink-muted">
                نحو وبلاغة وأدب ونصوص — كل قاعدة بشرحها وأمثلتها وتطبيقاتها، ومعها
                ملازم تذاكر منها واختبارات تقيس فهمك أولًا بأول.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center gap-2.5 rounded-[var(--radius-field)] bg-brand-700 px-6 text-sm font-semibold text-ink-invert transition-colors hover:bg-brand-800"
                >
                  ابدأ الآن
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
                <a
                  href="#courses"
                  className="inline-flex h-12 items-center gap-2.5 rounded-[var(--radius-field)] border border-brand-600 bg-surface/70 px-6 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <BookOpen className="size-4" aria-hidden />
                  اكتشف المقررات
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ما تحصل عليه */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="mx-auto max-w-6xl scroll-mt-16 px-5 py-12 sm:px-8 sm:py-16"
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
            className="scroll-mt-16 border-y border-border-subtle bg-surface"
          >
            <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
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
          className="mx-auto max-w-6xl scroll-mt-16 px-5 py-12 sm:px-8 sm:py-16"
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
          className="scroll-mt-16 border-y border-border-subtle bg-surface"
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:items-start">
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
          className="mx-auto max-w-6xl scroll-mt-16 px-5 py-12 sm:px-8 sm:py-16"
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
          className="mx-auto max-w-6xl scroll-mt-16 px-5 py-12 sm:px-8 sm:py-16"
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
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
