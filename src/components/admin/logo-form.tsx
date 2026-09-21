'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { uploadLogo, removeLogo } from '@/lib/mutations/settings'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/ui/confirm-button'

export function LogoForm({ current, siteName }: { current: string | null; siteName: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, start] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)

  const pick = (file: File | undefined) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))

    start(async () => {
      const fd = new FormData()
      fd.set('logo', file)
      const res = await uploadLogo(fd)

      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''

      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  const shown = preview ?? current

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start gap-5">
        <div className="relative grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted">
          {shown ? (
            <Image
              src={shown}
              alt={`شعار ${siteName}`}
              fill
              sizes="10rem"
              className="object-contain p-3"
              unoptimized={Boolean(preview)}
            />
          ) : (
            <ImagePlus className="size-6 text-ink-faint" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base leading-[1.9] text-ink-muted">
            يظهر في رأس الموقع وتذييله وشاشات الدخول. الأنسب صورة عريضة بخلفية
            شفافة، بصيغة PNG أو WebP، وبحجم لا يتجاوز ٢ ميجابايت. بدون شعار يظهر
            اسم المنصة نصًّا.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => pick(e.target.files?.[0])}
            className="sr-only"
            id="platform-logo"
          />

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="secondary"
              loading={pending}
              loadingText="جارٍ الرفع…"
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden />
              {current ? 'استبدل الشعار' : 'ارفع شعارًا'}
            </Button>

            {current && !pending && (
              <ConfirmButton
                label="احذف الشعار"
                icon={<Trash2 aria-hidden />}
                title="حذف شعار المنصة؟"
                body="سيظهر اسم المنصة نصًّا بدل الشعار. يمكنك رفع شعار آخر في أي وقت."
                confirmLabel="احذف الشعار"
                action={removeLogo}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
