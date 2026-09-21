import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, Send } from 'lucide-react'
import { requireAdminPage } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, EmptyState } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsBack } from '@/components/admin/settings-back'
import {
  NotificationTemplatesForm,
  type TemplateRow,
} from '@/components/admin/notification-templates-form'

export const metadata: Metadata = { title: 'قوالب الإشعارات' }

export default async function NotificationTemplatesPage() {
  await requireAdminPage('settings')
  const supabase = await createClient()

  const { data } = await supabase
    .from('notification_templates')
    .select('key, label, description, title, body, placeholders, updated_at')
    .order('key')

  const templates: TemplateRow[] = (data ?? []).map((t) => ({
    key: t.key,
    label: t.label,
    description: t.description,
    title: t.title,
    body: t.body,
    placeholders: t.placeholders,
    updatedAt: t.updated_at,
  }))

  return (
    <div className="space-y-6">
      <SettingsBack />

      <PageHeader
        title="قوالب الإشعارات"
        description="نصوص الإشعارات التي ترسلها المنصة تلقائيًا إلى الطلاب."
        action={
          <Link
            href="/admin/notifications"
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-field)] border border-border-strong bg-surface px-4 text-base font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            <Send className="size-4" aria-hidden />
            إرسال إشعار يدوي
          </Link>
        }
      />

      <Card>
        <CardHeader title="القوالب" icon={Bell} />
        {templates.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="لا قوالب بعد"
            description="لم تُهيَّأ قوالب الإشعارات في قاعدة البيانات. تواصل مع من يدير الخادم."
          />
        ) : (
          <NotificationTemplatesForm templates={templates} />
        )}
      </Card>
    </div>
  )
}
