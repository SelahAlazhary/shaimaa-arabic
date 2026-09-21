import type { Metadata } from 'next'
import { Bell, Send } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { AnnounceForm } from '@/components/admin/announce-form'
import { formatDateTime, formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'الإشعارات' }

export default async function AdminNotificationsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [recentRes, totalRes, studentsRes, gradesRes, coursesRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, body, created_at, is_read')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('notifications').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('status', 'active'),
    supabase.from('grades').select('id, name_ar').eq('is_visible', true).order('sort_order'),
    supabase.from('courses').select('id, title').eq('status', 'published').order('title'),
  ])

  const items = recentRes.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإشعارات"
        description="الإشعارات التي وصلت للطلاب داخل المنصة."
      />

      <Card className="p-5">
        <p className="nums-ar text-base text-ink-muted">
          يصل الإشعار إلى <strong className="text-ink">{formatNumber(studentsRes.count ?? 0)}</strong>{' '}
          طالبًا نشطًا. أُرسل حتى الآن{' '}
          <strong className="text-ink">{formatNumber(totalRes.count ?? 0)}</strong> إشعارًا.
        </p>
        <p className="mt-2 text-base leading-relaxed text-ink-faint">
          الإشعارات التلقائية (تفعيل كود، فتح مقرر) تُرسل من القاعدة مباشرة ولا تحتاج تدخّلًا.
        </p>
      </Card>
      <Card>
        <CardHeader title="إرسال إشعار" icon={Send} />
        <AnnounceForm
          grades={(gradesRes.data ?? []).map((g) => ({ id: g.id, label: g.name_ar }))}
          courses={(coursesRes.data ?? []).map((c) => ({ id: c.id, label: c.title }))}
        />
      </Card>


      <Card>
        <CardHeader title="آخر الإشعارات" icon={Bell} />

        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="لا إشعارات بعد"
            description="يظهر هنا كل إشعار تُرسله المنصة: تفعيل كود، أو فتح مقرر لطالب."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {items.map((n) => (
              <li key={n.id} className="px-5 py-3.5">
                <p className="text-base font-medium text-ink">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 text-base leading-relaxed text-ink-muted">{n.body}</p>
                )}
                <p className="nums-ar mt-1 text-sm text-ink-faint">
                  {formatDateTime(n.created_at)} · {n.is_read ? 'مقروء' : 'غير مقروء'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
