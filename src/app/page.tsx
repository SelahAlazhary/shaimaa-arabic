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
    body: 'شرح خطوة بخطوة، تعيده متى شئت، والمنصة تحفظ آخر نقطة وقفت عندها.',
  },
  {
    title: 'ملازم ومذكرات',
    body: 'ملفات PDF مع كل مقرر، تحمّلها على جهازك وتذاكر منها بلا إنترنت.',
  },
  {
    title: 'اختبارات مصحّحة',
    body: 'نتيجتك ودرجتك في كل سؤال تظهر فور التسليم، بلا انتظار.',
  },
  {
    title: 'حصص مباشرة',
    body: 'مراجعات بالبثّ المباشر، ومن فاتته الحصة يجد تسجيلها في حسابه.',
  },
]

const EXAM_POINTS = [
  {
    title: 'تصحيح فوري',
    body: 'درجتك في كل سؤال تظهر لحظة التسليم.',
  },
  {
    title: 'مؤقّت من الخادم',
    body: 'الوقت يُحسب على ساعة الخادم، فلا يزيد بإعادة فتح الصفحة.',
  },
  {
    title: 'مراجعة الإجابات',
    body: 'بعد التسليم ترى أين أخطأت، والإجابة الصحيحة مع شرحها.',
  },
  {
    title: 'عدد محاولات واضح',
    body: 'تعرف عدد محاولاتك المتاحة قبل أن تبدأ.',
  },
] as const

const FILE_POINTS = [
  {
    title: 'مرتَّبة مع المقرر',
    body: 'كل ملف تحت المقرر الذي يخصّه.',
  },
  {
    title: 'تحميل على جهازك',
    body: 'حمّلها مرة، وذاكر منها بلا إنترنت.',
  },
  {
    title: 'لمشتركي المقرر',
    body: 'روابط مؤقّتة لا تُفتح من خارج حسابك.',
  },
  {
    title: 'تتحدّث أولًا بأول',
    body: 'الملفات الجديدة تظهر في حسابك فور رفعها.',
  },
] as const

const SUPPORT_POINTS = [
  {
    title: 'سؤال في المنهج',
    body: 'اسأل عن قاعدة أو نصّ لم يتّضح، ويصلك الرد في حسابك.',
  },
  {
    title: 'مشكلة اشتراك',
    body: 'كود لم يُفعَّل أو مقرر لم يظهر؟ أبلغنا ونتابعه معك.',
  },
  {
    title: 'مشكلة تقنية',
    body: 'فيديو لا يعمل أو ملف لا يفتح؟ صف ما حدث ونحلّه.',
  },
] as const

const STEPS = [
  {
    title: 'أنشئ حسابك',
    body: 'بياناتك الأساسية ومرحلتك الدراسية، في دقيقة واحدة.',
  },
  {
    title: 'فعّل الكود',
    body: 'اكتب الكود الذي حصلت عليه، ويُفتح المقرر في حسابك فورًا.',
  },
  {
    title: 'ابدأ المذاكرة',
    body: 'الدروس والملفات والاختبارات في مكان واحد، مع متابعة لتقدّمك.',
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
            lead="أربعة عناصر يقوم عليها كل مقرر: الشرح، والمادة المكتوبة، والقياس، والمتابعة المباشرة."
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
                    لكل صفّ مقرره: نحو وبلاغة وأدب ونصوص، مقسّمة وحدات ودروسًا
                    بالترتيب الذي تُدرَّس به في المدرسة.
                    {publishedCourses > 0 && (
                      <span className="nums-ar">
                        {' '}
                        {formatNumber(publishedCourses)} مقرر متاح الآن.
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
              title="نتيجتك فور التسليم"
              lead="الاختبار يُصحَّح لحظة تسليمه: درجتك في كل سؤال، والإجابة الصحيحة مع شرحها. والمؤقّت يُحسب على ساعة الخادم، فلا يتأثر بإغلاق الصفحة أو انقطاع الإنترنت."
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
            lead="لكل مقرر ملفاته: ملازم ومذكرات وأوراق تطبيقات بصيغة PDF، تفتحها من حسابك وتحمّلها على جهازك لتذاكر منها بلا إنترنت."
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
              lead="داخل حسابك محادثة دعم مباشرة: اكتب سؤالك وتابع الرد عليه في المكان نفسه، واعرف حالة طلبك في كل خطوة."
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
                أنشئ حسابك الآن، وفعّل الكود متى حصلت عليه.
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
            منصة الأستاذة الشيماء أحمد لتعليم اللغة العربية — للمرحلتين الإعدادية
            والثانوية. © {formatNumber(new Date().getFullYear())}
          </p>
          <nav aria-label="روابط الحساب" className="flex gap-5 text-sm text-ink-muted">
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
