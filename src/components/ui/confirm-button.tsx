'use client'

import { useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * إجراء هدّام بتأكيد (البند 34).
 *
 * الحوار عنصر <dialog> أصلي: يحبس التركيز ويغلق بـEsc بلا كود إضافي.
 * وفتحه وإغلاقه يجريان على العنصر مباشرة لا عبر حالة React — لأن المتصفّح
 * يغلقه من تلقاء نفسه بـEsc، فأي حالة موازية تفترض أنه ما زال مفتوحًا
 * وتمنع فتحه ثانية.
 */
export function ConfirmButton({
  label,
  srLabel,
  title,
  body,
  confirmLabel = 'تأكيد',
  action,
  icon,
  size = 'sm',
  variant = 'ghost',
}: {
  label: string
  /** اسم مسموع حين يكون الزرّ أيقونة بلا نص (البند 22) */
  srLabel?: string
  title: string
  body: string
  confirmLabel?: string
  action: () => Promise<{ ok: boolean; message?: string }>
  icon?: React.ReactNode
  size?: 'sm' | 'md'
  variant?: 'ghost' | 'secondary' | 'danger'
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pending, start] = useTransition()

  const run = () =>
    start(async () => {
      const res = await action()
      dialogRef.current?.close()
      if (res.ok) toast.success(res.message ?? 'تم.')
      else toast.error(res.message ?? 'تعذّر التنفيذ. أعد المحاولة.')
    })

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => dialogRef.current?.showModal()}
        aria-label={label ? undefined : srLabel}
        className="shrink-0"
      >
        {icon}
        {label}
      </Button>

      <dialog
        ref={dialogRef}
        className="w-[min(26rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-0 text-ink shadow-[var(--shadow-pop)] backdrop:bg-ink/40"
      >
        <div className="p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-bg text-danger">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-start gap-2.5">
            <Button variant="danger" loading={pending} loadingText="جارٍ التنفيذ…" onClick={run}>
              {confirmLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </dialog>
    </>
  )
}
