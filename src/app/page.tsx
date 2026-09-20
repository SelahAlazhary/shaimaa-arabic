import type { Metadata } from 'next'
import Link from 'next/link'

import { Navbar } from '@/components/site/navbar'
import { SectionHeading, LedgerGrid } from '@/components/site/section'
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
    title: 'دروس بالفيديو',
    body: 'كل درس مشروح خطوة بخطوة، تعيده متى شئت، والمنصة تحفظ لك آخر نقطة وقفت عندها.',
  },
  {
    title: 'ملازم ومذكرات',
    body: 'ملفات PDF مرتبطة بكل كورس، تحمّلها على جهازك وتذاكر منها بلا إنترنت.',
  },
  {
    title: 'اختبارات مصحّحة',
    body: 'تُصحَّح فور التسليم وتظهر لك نتيجتك ودرجتك في كل سؤال — بلا انتظار.',
  },
  {
    title: 'حصص مباشرة',
    body: 'مراجعات وحصص بث مباشر، ومن فاتته الحصة يجد تسجيلها في حسابه.',
  },
]

const EXAM_POINTS = [
  {
    title: 'تصحيح فوري',
    body: 'النتيجة والدرجة في كل سؤال تظهر لحظة التسليم.',
  },
  {
    title: 'مؤقّت لا يُخدَع',
    body: 'الوقت محسوب على الخادم، فلا يزيد بإعادة فتح الصفحة.',
  },
  {
    title: 'مراجعة الإجابات',
    body: 'ترى أين أخطأت، والإجابة الصحيحة مع شرحها.',
  },
  {
    title: 'محاولات معلومة',
    body: 'عدد المحاولات مكتوب قبل أن تبدأ، لا مفاجآت.',
  },
] as const

const FILE_POINTS = [
  {
    title: 'مرتبطة بالكورس',
    body: 'كل ملف في مكانه تحت الكورس الذي يخصّه.',
  },
  {
    title: 'تحميل للمذاكرة',
    body: 'حمّلها مرة وذاكر منها بلا إنترنت.',
  },
  {
    title: 'لمشتركي الكورس',
    body: 'روابط مؤقّتة لا تُشارَك ولا تُفتح من خارج حسابك.',
  },
  {
    title: 'تتحدّث أولًا بأول',
    body: 'الإضافات الجديدة تظهر في حسابك فور رفعها.',
  },
] as const

const SUPPORT_POINTS = [
  {
    title: 'سؤال في المنهج',
    body: 'اسأل عن قاعدة أو نص لم يتّضح، ويصلك الرد في حسابك.',
  },
  {
    title: 'مشكلة اشتراك',
    body: 'كود لم يُفعَّل أو كورس لم يظهر — أبلغنا وتُحلّ.',
  },
  {
    title: 'مشكلة تقنية',
    body: 'فيديو لا يعمل أو ملف لا يفتح، صف ما حدث ونتابعه.',
  },
] as const

const STEPS = [
  {
    title: 'أنشئ حسابك',
    body: 'بياناتك الأساسية ومرحلتك الدراسية، في دقيقة واحدة.',
  },
  {
    title: 'فعّل كود الاشتراك',
    body: 'اكتب الكود الذي حصلت عليه، ويُفتح الكورس على حسابك فورًا.',
  },
  {
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
          className="mx-auto max-w-7xl scroll-mt-16 px-5 py-16 sm:px-8 sm:py-20 lg:scroll-mt-20"
        >
          <SectionHeading
            id="features-title"
            eyebrow="ما تقدّمه المنصة"
            title="ما تجده في حسابك"
            lead="أربعة عناصر يقوم عليها كل كورس: الشرح، والمادة المكتوبة، والقياس، والمتابعة المباشرة."
          />
          <LedgerGrid items={FEATURES} />
        </section>

        {/* الصفوف — من قاعدة البيانات لا قائمة ثابتة */}
        {stages.length > 0 && (
          <section
            id="courses"
            aria-labelledby="stages-title"
            className="scroll-mt-16 lg:scroll-mt-20 border-y border-border-subtle bg-surface"
          >
            <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14">
              <SectionHeading
                id="stages-title"
                eyebrow="المقررات"
                title="المقررات والصفوف"
                lead={
                  <>
                    كل صف له مقرره الخاص: نحو وبلاغة وأدب ونصوص، مقسّمة وحدات ودروسًا
                    بالترتيب الذي تُدرَّس به في المدرسة.
                    {publishedCourses > 0 && (
                      <span className="nums-ar">
                        {' '}
                        {formatNumber(publishedCourses)} كورس متاح الآن.
                      </span>
                    )}
                  </>
                }
              />

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {stages.map((s) => {
                  const stageGrades = grades.filter((g) => g.stage_id === s.id)
                  if (stageGrades.length === 0) return null

                  return (
                    <div key={s.id}>
                      <h3 className="text-lg font-semibold text-brand-800">{s.name_ar}</h3>
                      <ul className="mt-2.5 flex flex-wrap gap-2">
                        {stageGrades.map((g) => (
                          <li
                            key={g.id}
                            className="rounded-[var(--radius-pill)] border border-border-subtle bg-surface-muted px-4 py-1.5 text-base text-ink-muted"
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
          className="border-y border-border-subtle bg-surface-muted"
        >
          <div className="mx-auto max-w-7xl scroll-mt-16 px-5 py-16 sm:px-8 sm:py-20 lg:scroll-mt-20">
            <SectionHeading
              id="exams-title"
              eyebrow="الاختبارات"
              title="تعرف درجتك لحظة ما تسلّم"
              lead="الاختبار يُصحَّح فور التسليم، وتظهر لك درجتك في كل سؤال والإجابة الصحيحة مع شرحها. والمؤقّت يُحسب على ساعة الخادم لا ساعة جهازك، فلا يتأثر بإغلاق الصفحة أو انقطاع الإنترنت."
            />
            <LedgerGrid items={EXAM_POINTS} />
          </div>
        </section>

        <section
          id="files"
          aria-labelledby="files-title"
          className="mx-auto max-w-7xl scroll-mt-16 px-5 py-16 sm:px-8 sm:py-20 lg:scroll-mt-20"
        >
          <SectionHeading
            id="files-title"
            eyebrow="الملفات"
            title="ملازم تحمّلها وتذاكر منها"
            lead="لكل كورس ملفاته: ملازم ومذكرات وأوراق تطبيقات بصيغة PDF، تفتحها من حسابك وتحمّلها على جهازك لتذاكر منها بلا إنترنت."
          />
          <LedgerGrid items={FILE_POINTS} />
        </section>

        <section
          id="support"
          aria-labelledby="support-title"
          className="border-y border-border-subtle bg-surface-muted"
        >
          <div className="mx-auto max-w-7xl scroll-mt-16 px-5 py-16 sm:px-8 sm:py-20 lg:scroll-mt-20">
            <SectionHeading
              id="support-title"
              eyebrow="الدعم"
              title="سؤالك لا يضيع"
              lead="داخل حسابك محادثة دعم مباشرة: تكتب سؤالك وتتابع الرد عليه في المكان نفسه، وتعرف حالة طلبك في كل خطوة."
            />
            <LedgerGrid items={SUPPORT_POINTS} columns={3} />
          </div>
        </section>

        {/* كيف تبدأ */}
        <section
          id="steps"
          aria-labelledby="steps-title"
          className="mx-auto max-w-7xl scroll-mt-16 px-5 py-16 sm:px-8 sm:py-20 lg:scroll-mt-20"
        >
          <SectionHeading
            id="steps-title"
            eyebrow="البداية"
            title="كيف تبدأ"
            lead="ثلاث خطوات بينك وبين أول درس."
          />
          <LedgerGrid items={STEPS} columns={3} />

          <div className="mt-14 overflow-hidden rounded-[var(--radius-card)] border border-accent/40 bg-brand-800">
            <div className="relative px-6 py-12 text-center sm:px-10">
              <p className="flex items-center justify-center gap-3 text-[0.9375rem] font-semibold tracking-wide text-accent-soft">
                <span className="h-px w-14 bg-accent/70" aria-hidden />
                ابدأ اليوم
                <span className="h-px w-14 bg-accent/70" aria-hidden />
              </p>
              <h2 className="mt-4 text-2xl font-bold text-ink-invert sm:text-3xl">
                حسابك جاهز في دقيقة
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[1.0625rem] leading-[1.95] text-brand-100">
                أنشئ حسابك الآن، وفعّل كود الاشتراك متى حصلت عليه.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex h-14 items-center rounded-[var(--radius-field)] bg-accent px-9 text-[0.9375rem] font-semibold text-brand-900 transition-colors hover:bg-accent-soft"
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <p className="nums-ar text-sm text-ink-muted">
            © {formatNumber(new Date().getFullYear())} منصة الأستاذة الشيماء أحمد
          </p>
          <nav aria-label="روابط" className="flex gap-5 text-sm text-ink-muted">
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
