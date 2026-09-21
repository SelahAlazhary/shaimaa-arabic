'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { uploadCourseImage, removeCourseImage } from '@/lib/mutations/course-image'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/ui/confirm-button'

export function CourseImageForm({
  courseId,
  current,
  courseTitle,
}: {
  courseId: string
  current: string | null
  courseTitle: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, start] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)

  const pick = (file: File | undefined) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))

    start(async () => {
      const fd = new FormData()
      fd.set('image', file)
      const res = await uploadCourseImage(courseId, fd)

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
        <div className="relative aspect-video w-56 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted">
          {shown ? (
            <Image
              src={shown}
              alt={`صورة ${courseTitle}`}
              fill
              sizes="14rem"
              className="object-cover"
              // الصورة من تخزين عامّ وقد تتغيّر؛ unoptimized للمعاينة المحلية فقط
              unoptimized={Boolean(preview)}
            />
          ) : (
            <span className="grid size-full place-items-center text-ink-faint">
              <ImagePlus className="size-7" aria-hidden />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base leading-[1.9] text-ink-muted">
            تظهر للطالب في قائمة المقررات وصفحة المقرر. الأنسب نسبة عرض إلى ارتفاع
            ١٦:٩، بصيغة JPG أو PNG أو WebP، وبحجم لا يتجاوز ٥ ميجابايت.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => pick(e.target.files?.[0])}
            className="sr-only"
            id={`course-image-${courseId}`}
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
              {current ? 'استبدل الصورة' : 'ارفع صورة'}
            </Button>

            {current && !pending && (
              <ConfirmButton
                label="احذف الصورة"
                icon={<Trash2 aria-hidden />}
                title="حذف صورة المقرر؟"
                body="سيعود المقرر بلا صورة في قائمة الطالب. يمكنك رفع صورة أخرى في أي وقت."
                confirmLabel="احذف الصورة"
                action={() => removeCourseImage(courseId)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
