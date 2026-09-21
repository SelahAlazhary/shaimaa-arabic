import type { Metadata } from 'next'
import { Database, Mail, Video, HardDrive, ShieldCheck } from 'lucide-react'
import { requireAdminPage } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, StatCard } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsBack } from '@/components/admin/settings-back'
import { StorageCleanup } from '@/components/admin/storage-cleanup'
import { formatNumber, formatFileSize } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'النظام والنسخ الاحتياطي' }

export default async function SystemSettingsPage() {
  await requireAdminPage('settings')
  const supabase = await createClient()

  const [videosRes, lessonsRes, attachRes] = await Promise.all([
    supabase.from('lesson_videos').select('provider, storage_path'),
    supabase.from('lessons').select('id', { count: 'exact', head: true }),
    supabase.from('attachments').select('file_size'),
  ])

  const videos = videosRes.data ?? []
  const selfHosted = videos.filter((v) => v.storage_path).length
  const external = videos.length - selfHosted

  const attachmentBytes = (attachRes.data ?? []).reduce((sum, a) => sum + (a.file_size ?? 0), 0)

  return (
    <div className="space-y-6">
      <SettingsBack />

      <PageHeader
        title="النظام والنسخ الاحتياطي"
        description="حالة البريد ومساحة الفيديو وما تحتاج معرفته عن النسخ الاحتياطي."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Video}
          label="فيديو مستضاف داخل المنصة"
          value={formatNumber(selfHosted)}
          tone="info"
        />
        <StatCard
          icon={Video}
          label="فيديو من رابط خارجي"
          value={formatNumber(external)}
        />
        <StatCard
          icon={HardDrive}
          label="حجم المرفقات"
          value={formatFileSize(attachmentBytes)}
        />
      </div>

      <Card>
        <CardHeader title="صيانة مساحة الفيديو" icon={HardDrive} />
        <StorageCleanup />
      </Card>

      <Card>
        <CardHeader title="بريد المنصة" icon={Mail} />
        <div className="space-y-3 p-5 text-base leading-[1.9] text-ink-muted">
          <p>
            رسائل تأكيد الحساب واستعادة كلمة المرور يرسلها Supabase. البريد
            الافتراضي محدود العدد ويصلح للتجربة وحدها، فقبل فتح التسجيل على
            نطاق واسع اضبط خادم بريد خاصًّا (SMTP) من لوحة Supabase:
            Authentication ← Emails ← SMTP Settings.
          </p>
          <p>
            ضع كذلك عنوان المنصة في Authentication ← URL Configuration ←
            Redirect URLs، وإلّا فشلت روابط التأكيد واستعادة كلمة المرور.
          </p>
          <p className="text-ink-faint">
            هذه إعدادات تُضبط في لوحة Supabase لا من هنا: مفاتيح البريد أسرار
            لا يصحّ أن تمرّ عبر واجهة المنصة.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="النسخ الاحتياطي" icon={Database} />
        <div className="space-y-3 p-5 text-base leading-[1.9] text-ink-muted">
          <p>
            قاعدة البيانات تُنسخ يوميًّا نسخًا تلقائيًّا يديره Supabase، وتجدها في
            Database ← Backups. مدّة الاحتفاظ تتبع خطّة المشروع.
          </p>
          <p>
            ملفات التخزين (الفيديو والمرفقات والصور) لا تدخل في تلك النسخة.
            احتفظ بنسخة من ملفات الفيديو الأصلية على جهازك قبل رفعها.
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-1 size-4 shrink-0 text-ink-faint" aria-hidden />
            سجلّ التدقيق وبيانات الطلاب واشتراكاتهم لا تُحذف من المنصة: ما يُحذف
            محتوى، أمّا سجلّ الطالب فيبقى.
          </p>
        </div>
      </Card>
    </div>
  )
}
