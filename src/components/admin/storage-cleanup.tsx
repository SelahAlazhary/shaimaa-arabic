'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, Trash2 } from 'lucide-react'
import { cleanupOrphanVideos } from '@/lib/mutations/settings'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/ui/confirm-button'

/**
 * الملفات المعلّقة تنشأ حين ينقطع الرفع بين وصول الملف إلى التخزين
 * وربطه بالدرس. الفحص يسبق الحذف دائمًا: لا يُحذف شيء قبل أن يُعرف عدده.
 */
export function StorageCleanup() {
  const [pending, start] = useTransition()
  const [report, setReport] = useState<string | null>(null)

  const scan = () =>
    start(async () => {
      const res = await cleanupOrphanVideos(true)
      setReport(res.message)
      if (!res.ok) toast.error(res.message)
    })

  return (
    <div className="space-y-4 p-5">
      <p className="text-base leading-[1.9] text-ink-muted">
        يبحث عن ملفات فيديو في مساحة التخزين لا يشير إليها أيّ درس. لا يمسّ فيديو
        درس قائم، ولا يمسّ المرفقات ولا الصور.
      </p>

      {report && (
        <p role="status" className="rounded-[var(--radius-field)] bg-surface-muted px-4 py-3 text-base text-ink">
          {report}
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        <Button
          type="button"
          variant="secondary"
          loading={pending}
          loadingText="جارٍ الفحص…"
          onClick={scan}
        >
          <Search aria-hidden />
          افحص المساحة
        </Button>

        <ConfirmButton
          label="احذف الملفات المعلّقة"
          variant="danger"
          size="md"
          icon={<Trash2 aria-hidden />}
          title="حذف الملفات المعلّقة؟"
          body="ستُحذف ملفات الفيديو التي لا يشير إليها أيّ درس حذفًا نهائيًّا. فيديوهات الدروس القائمة لا تُمسّ."
          confirmLabel="احذف"
          action={() => cleanupOrphanVideos(false)}
        />
      </div>
    </div>
  )
}
