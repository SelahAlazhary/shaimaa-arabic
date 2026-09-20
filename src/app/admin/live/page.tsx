import type { Metadata } from 'next'
import { Radio, CalendarPlus } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { LiveForm } from '@/components/admin/live-form'
import { formatDateTime } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'البث المباشر' }

const STATUS = {
  scheduled: { label: 'مجدولة', tone: 'info' as const },
  live: { label: 'مباشر الآن', tone: 'danger' as const },
  ended: { label: 'انتهت', tone: 'neutral' as const },
  cancelled: { label: 'ملغاة', tone: 'warning' as const },
}

export default async function AdminLivePage() {
  await requireAdmin()
  const supabase = await createClient()

  const [coursesRes, streamsRes] = await Promise.all([
    supabase.from('courses').select('id, title').order('title'),
    supabase
    .from('live_streams')
    .select('id, title, starts_at, status, recording_url, courses(title)')
    .order('starts_at', { ascending: false })
    .limit(100),
  ])

  const streams = (streamsRes.data ?? []) as unknown as {
    id: string
    title: string
    starts_at: string
    status: keyof typeof STATUS
    recording_url: string | null
    courses: { title: string } | null
  }[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="البث المباشر"
        description="جدولة الحصص المباشرة وربط تسجيلاتها بعد انتهائها."
      />

      <Card>
        <CardHeader title="جدولة حصة جديدة" icon={CalendarPlus} />
        <LiveForm courses={coursesRes.data ?? []} />
      </Card>

      <Card>
        <CardHeader title="الحصص" icon={Radio} />

        {streams.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="لا حصص مباشرة بعد"
            description="أنشئ حصة، حدّد موعدها ورابطها والكورس التابعة له، ثم أشعر الطلاب."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {streams.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <span className="min-w-0">
                  <span className="block text-base font-medium text-ink">{s.title}</span>
                  <span className="nums-ar mt-0.5 block text-sm text-ink-faint">
                    {[s.courses?.title, formatDateTime(s.starts_at)].filter(Boolean).join(' · ')}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  {s.recording_url && <Badge tone="info">لها تسجيل</Badge>}
                  <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
