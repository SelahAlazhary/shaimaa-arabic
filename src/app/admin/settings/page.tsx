import type { Metadata } from 'next'
import { Settings, Database, ShieldCheck, ScrollText, Users } from 'lucide-react'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatDateTime, formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'الإعدادات' }

const ROLE_LABELS = {
  student: 'طالب',
  support: 'دعم',
  admin: 'مدير',
  super_admin: 'مدير عام',
} as const

export default async function AdminSettingsPage() {
  const me = await requireAdmin()
  const supabase = await createClient()

  const [brandingRes, staffRes, auditRes] = await Promise.all([
    supabase.from('platform_settings').select('key, value, updated_at').eq('key', 'branding').maybeSingle(),
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['support', 'admin', 'super_admin'])
      .order('role'),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const branding = (brandingRes.data?.value ?? {}) as { site_name?: string; code_prefix?: string }
  const staff = staffRes.data ?? []

  const audit = (auditRes.data ?? []) as unknown as {
    id: string
    action: string
    entity_type: string
    created_at: string
    profiles: { full_name: string } | null
  }[]

  const ACTION_LABELS: Record<string, string> = {
    code_redeemed: 'تفعيل كود',
    codes_generated: 'توليد أكواد',
    manual_enrollment: 'تسجيل يدوي',
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="بيانات المنصة والمشرفون وسجل الإجراءات." />

      <Card>
        <CardHeader title="بيانات المنصة" icon={Settings} />
        <dl className="divide-y divide-border-subtle">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <dt className="w-32 shrink-0 text-sm text-ink-muted">اسم المنصة</dt>
            <dd className="text-sm text-ink">{branding.site_name ?? '—'}</dd>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <dt className="w-32 shrink-0 text-sm text-ink-muted">بادئة الأكواد</dt>
            <dd className="font-mono text-sm text-ink" dir="ltr">
              {branding.code_prefix ?? 'SHIMA'}
            </dd>
          </div>
          {brandingRes.data?.updated_at && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <dt className="w-32 shrink-0 text-sm text-ink-muted">آخر تحديث</dt>
              <dd className="nums-ar text-sm text-ink-faint">
                {formatDateTime(brandingRes.data.updated_at)}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="المشرفون والصلاحيات"
          icon={Users}
          action={
            <span className="nums-ar text-xs text-ink-faint">{formatNumber(staff.length)} حساب</span>
          }
        />
        <ul className="divide-y divide-border-subtle">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">
                  {s.full_name}
                  {s.id === me.id && <span className="text-ink-faint"> (أنت)</span>}
                </span>
                <span className="block truncate text-xs text-ink-faint" dir="ltr">
                  {s.email}
                </span>
              </span>
              <span className="shrink-0 text-sm text-ink-muted">
                {ROLE_LABELS[s.role as keyof typeof ROLE_LABELS]}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="سجل التدقيق" icon={ScrollText} />
        {audit.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="السجل فارغ"
            description="كل إجراء إداري حسّاس (توليد أكواد، تسجيل يدوي) يُسجَّل هنا تلقائيًا."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {audit.map((a) => (
              <li key={a.id} className="px-5 py-3">
                <p className="text-sm text-ink">
                  {ACTION_LABELS[a.action] ?? a.action}
                  <span className="text-ink-faint"> · {a.entity_type}</span>
                </p>
                <p className="nums-ar mt-0.5 text-xs text-ink-faint">
                  {[a.profiles?.full_name, formatDateTime(a.created_at)].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ShieldCheck className="size-4 text-ink-muted" aria-hidden />
          الأمان والنسخ الاحتياطي
        </h2>
        <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-ink-muted">
          <Database className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
          النسخ الاحتياطي اليومي يديره Supabase تلقائيًا. سجل التدقيق للقراءة فقط ولا
          يمكن تعديله أو حذفه من المنصة.
        </p>
      </Card>
    </div>
  )
}
