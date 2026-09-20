import type { Metadata } from 'next'
import { Radio, CalendarClock, PlayCircle, ExternalLink } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatDateTime } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'البث المباشر' }

type Stream = {
  id: string
  title: string
  description: string | null
  stream_url: string | null
  recording_url: string | null
  starts_at: string
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  courses: { title: string } | null
}

export default async function StudentLivePage() {
  await requireStudent()
  const supabase = await createClient()

  // RLS تقصر النتائج على كورسات الطالب المسجَّل فيها
  const { data } = await supabase
    .from('live_streams')
    .select('id, title, description, stream_url, recording_url, starts_at, status, courses(title)')
    .order('starts_at', { ascending: false })
    .limit(50)

  const streams = (data ?? []) as unknown as Stream[]
  const upcoming = streams
    .filter((s) => s.status === 'scheduled' || s.status === 'live')
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const recordings = streams.filter((s) => s.recording_url)

  return (
    <div className="space-y-6">
      <PageHeader
        title="البث المباشر"
        description="حصصك المباشرة القادمة وتسجيلات الحصص السابقة."
      />

      <Card>
        <CardHeader title="الحصص القادمة والمباشرة" icon={CalendarClock} />

        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="لا حصص مباشرة قادمة"
            description="هيوصلك إشعار فور جدولة حصة جديدة في أحد كورساتك."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {upcoming.map((s) => (
              <li key={s.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{s.title}</p>
                    {s.courses?.title && (
                      <p className="mt-0.5 text-xs text-ink-muted">{s.courses.title}</p>
                    )}
                  </div>
                  <Badge tone={s.status === 'live' ? 'danger' : 'info'}>
                    {s.status === 'live' ? 'مباشر الآن' : 'قادمة'}
                  </Badge>
                </div>

                <p className="nums-ar mt-1.5 text-xs text-ink-faint">{formatDateTime(s.starts_at)}</p>

                {s.status === 'live' && s.stream_url && (
                  <a
                    href={s.stream_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-[var(--radius-field)] bg-brand-700 px-4 text-sm font-medium text-ink-invert transition-colors hover:bg-brand-800"
                  >
                    <Radio className="size-4" aria-hidden />
                    ادخل الحصة
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="تسجيلات سابقة" icon={PlayCircle} />

        {recordings.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            title="لا تسجيلات بعد"
            description="تسجيلات الحصص المنتهية هتظهر هنا لتقدر تراجعها في أي وقت."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {recordings.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{s.title}</span>
                  <span className="nums-ar mt-0.5 block text-xs text-ink-faint">
                    {formatDateTime(s.starts_at)}
                  </span>
                </span>
                <a
                  href={s.recording_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1.5 text-sm text-brand-600 underline-offset-4 hover:underline"
                >
                  <PlayCircle className="size-4" aria-hidden />
                  مشاهدة
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
