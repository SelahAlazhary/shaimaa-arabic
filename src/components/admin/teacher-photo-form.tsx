'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { RotateCcw, Upload } from 'lucide-react'
import { uploadTeacherPhoto, removeTeacherPhoto } from '@/lib/mutations/settings'
import { DEFAULT_TEACHER_PHOTO } from '@/lib/branding-constants'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/ui/confirm-button'

export function TeacherPhotoForm({ current }: { current: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, start] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)

  const pick = (file: File | undefined) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))

    start(async () => {
      const fd = new FormData()
      fd.set('teacher', file)
      const res = await uploadTeacherPhoto(fd)

      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''

      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  const shown = preview ?? current ?? DEFAULT_TEACHER_PHOTO

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start gap-5">
        <div className="relative h-40 w-32 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-brand-800">
          <Image
            src={shown}
            alt="صورة المدرّسة"
            fill
            sizes="8rem"
            className="object-contain object-bottom"
            unoptimized={Boolean(preview)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base leading-[1.9] text-ink-muted">
            تظهر في الصفحة الرئيسية وشاشات الدخول والتسجيل. الأنسب صورة طولية
            بخلفية شفافة أو بيضاء، بصيغة PNG أو WebP أو JPG، وبحجم لا يتجاوز ٢ ميجابايت.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => pick(e.target.files?.[0])}
            className="sr-only"
            id="teacher-photo"
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
              غيّر الصورة
            </Button>

            {current && !pending && (
              <ConfirmButton
                label="استرجع الصورة الافتراضية"
                icon={<RotateCcw aria-hidden />}
                title="استرجاع الصورة الافتراضية؟"
                body="ستُحذف الصورة المرفوعة وتعود الصورة الافتراضية للمنصة. يمكنك رفع صورة أخرى في أي وقت."
                confirmLabel="استرجع"
                action={removeTeacherPhoto}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
