import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpen,
  ClipboardList,
  Radio,
  TrendingUp,
  FileText,
  CalendarClock,
  ArrowLeft,
  Download,
} from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { getStudentHome } from '@/lib/queries/student-home'
import { Card, CardHeader, EmptyState, StatCard, ProgressBar, Badge } from '@/components/ui/card'
import { formatNumber, formatDateTime, formatFileSize } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'الرئيسية' }

export default async function StudentHomePage() {
  const user = await requireStudent()
  const home = await getStudentHome()

  const firstName = user.fullName.trim().split(/\s+/)[0] ?? user.fullName
  const inProgress = home.courses.find((c) => c.percent > 0 && c.percent < 100) ?? home.courses[0]

  return (
    <div className="space-y-6">
      {/* الترحيب + الخطوة التالية الوحيدة المهمة (البند 29) */}
      <section className="rounded-[var(--radius-panel)] bg-brand-700 px-6 py-7 text-ink-invert sm:px-8">
        <h1 className="text-xl font-semibold sm:text-2xl">أهلًا، {firstName}</h1>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-brand-100">
          {home.courses.length > 0
            ? 'كمّل من حيث وقفت، ولا تنسَ مراجعة المرفقات قبل الاختبار.'
            : 'مفيش كورسات مفتوحة على حسابك لسه. فعّل كود الاشتراك عشان تبدأ.'}
        </p>

        <div className="mt-5">
          {inProgress ? (
            <Link
              href={`/student/courses/${inProgress.slug}`}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] bg-surface px-4 text-base font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              <BookOpen className="size-4" aria-hidden />
              تابع: {inProgress.title}
            </Link>
          ) : (
            <Link
              href="/student/courses"
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] bg-surface px-4 text-base font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              <BookOpen className="size-4" aria-hidden />
              تفعيل كود اشتراك
            </Link>
          )}
        </div>
      </section>

      {/* الأرقام: أربعة فقط — لوحة مزدحمة لا تُقرأ (البند 29) */}
      <section aria-label="ملخّص سريع" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="كورساتي"
          value={formatNumber(home.courses.length)}
          tone="info"
        />
        <StatCard
          icon={ClipboardList}
          label="اختبارات متاحة"
          value={formatNumber(home.availableExams)}
          tone="warning"
        />
        <StatCard
          icon={Radio}
          label="بث قادم"
          value={formatNumber(home.upcoming.length)}
          tone="neutral"
        />
        <StatCard
          icon={TrendingUp}
          label="نسبة التقدّم"
          value={`${formatNumber(home.overallPercent)}٪`}
          tone="success"
        />
      </section>

      {/* كورساتي */}
      <Card>
        <CardHeader
          title="كورساتي"
          icon={BookOpen}
          action={
            home.courses.length > 0 ? (
              <Link
                href="/student/courses"
                className="flex items-center gap-1 text-base text-brand-600 underline-offset-4 hover:underline"
              >
                عرض الكل
                <ArrowLeft className="size-3.5" aria-hidden />
              </Link>
            ) : undefined
          }
        />

        {home.courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد كورسات بعد"
            description="بعد ما تفعّل كود الاشتراك، هيظهر الكورس هنا وتقدر تبدأ الدروس فورًا."
            action={
              <Link
                href="/student/courses"
                className="inline-flex h-11 items-center rounded-[var(--radius-field)] bg-brand-700 px-4 text-base font-medium text-ink-invert transition-colors hover:bg-brand-800"
              >
                تفعيل كود اشتراك
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {home.courses.slice(0, 4).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/student/courses/${c.slug}`}
                  className="block px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-medium text-ink">{c.title}</p>
                    <Badge tone={c.percent === 100 ? 'success' : 'neutral'}>
                      {formatNumber(c.percent)}٪
                    </Badge>
                  </div>
                  <p className="nums-ar mt-1 text-sm text-ink-faint">
                    {formatNumber(c.completedLessons)} من {formatNumber(c.totalLessons)} درس
                  </p>
                  <div className="mt-3">
                    <ProgressBar value={c.percent} label={`تقدّمك في ${c.title}`} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* البث القادم */}
        <Card>
          <CardHeader title="الحصص القادمة" icon={CalendarClock} />
          {home.upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="لا حصص مباشرة قادمة"
              description="هيوصلك إشعار فور جدولة حصة جديدة في كورساتك."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {home.upcoming.map((l) => (
                <li key={l.id} className="px-5 py-4">
                  <p className="text-base font-medium text-ink">{l.title}</p>
                  <p className="nums-ar mt-1 text-sm text-ink-faint">{formatDateTime(l.startsAt)}</p>
                  {l.courseTitle && (
                    <p className="mt-1 text-sm text-ink-muted">{l.courseTitle}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* المرفقات */}
        <Card>
          <CardHeader title="مرفقات كورساتي" icon={FileText} />
          {home.attachments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="لا توجد مرفقات"
              description="الملازم والمذكرات المرتبطة بكورساتك هتظهر هنا للتحميل."
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {home.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={`/attachments/${a.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium text-ink">{a.title}</span>
                      <span className="nums-ar mt-0.5 block text-sm text-ink-faint">
                        {a.courseTitle} · {formatFileSize(a.fileSize)}
                      </span>
                    </span>
                    <Download className="size-4 shrink-0 text-ink-faint" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
