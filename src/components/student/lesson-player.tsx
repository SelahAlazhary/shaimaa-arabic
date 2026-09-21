'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { CheckCircle2, Lock, VideoOff } from 'lucide-react'
import { toast } from 'sonner'
import { saveLessonProgress, markLessonComplete } from '@/lib/mutations/progress'
import { Button } from '@/components/ui/button'
import { VideoWatermark } from '@/components/student/video-watermark'

type Props = {
  lessonId: string
  /** اسم الطالب — يظهر علامةً مائية فوق الفيديو لردع التسريب */
  watermark: string
  videoUrl: string | null
  provider: string | null
  /** نسبة المشاهدة التي تُعدّ إكمالًا تلقائيًّا */
  requiredPercent: number
  allowDownload: boolean
  watchedSeconds: number
  completed: boolean
  entitled: boolean
}

/** يحوّل روابط يوتيوب/فيميو العادية إلى صيغة التضمين. */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    /*
     * معاملات تُقلّل ما يدلّ على المصدر:
     * rel=0 يحصر المقترحات في القناة نفسها، وiv_load_policy=3 يمنع
     * التعليقات التوضيحية، وmodestbranding يُصغّر الشعار.
     * ما لا تزيله هذه المعاملات — شريط العنوان و«مشاهدة على YouTube» —
     * يحجبه غطاء شفّاف فوق الشريط العلوي في العارض.
     */
    const YT_PARAMS =
      'rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&cc_load_policy=0&color=white'

    if (host === 'youtu.be') {
      return `https://www.youtube-nocookie.com/embed${u.pathname}?${YT_PARAMS}`
    }
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?${YT_PARAMS}`
      if (u.pathname.startsWith('/embed/')) {
        return `${u.origin}${u.pathname}?${YT_PARAMS}`
      }
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
      return url
    }
    return null
  } catch {
    return null
  }
}

const DIRECT_VIDEO = /\.(mp4|webm|ogg|m3u8)(\?|$)/i

export function LessonPlayer({
  lessonId,
  watermark,
  videoUrl,
  provider,
  requiredPercent,
  allowDownload,
  watchedSeconds,
  completed,
  entitled,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isComplete, setIsComplete] = useState(completed)
  const [pending, startTransition] = useTransition()
  const lastSaved = useRef(0)

  // الحفظ كل ١٥ ثانية لا مع كل حدث timeupdate (يُطلق ٤ مرات في الثانية)
  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (watchedSeconds > 0 && watchedSeconds < el.duration) {
      el.currentTime = watchedSeconds
    }

    const onTime = () => {
      if (!el.duration || Number.isNaN(el.duration)) return
      const now = Math.floor(el.currentTime)
      if (now - lastSaved.current < 15) return
      lastSaved.current = now

      const percent = (el.currentTime / el.duration) * 100

      void saveLessonProgress({
        lessonId,
        watchedSeconds: now,
        progressPercent: percent,
      }).then(() => {
        // الدرس يكتمل ببلوغ النسبة المطلوبة، لا بانتهاء الشريط:
        // كثير من الدروس تُختم بثوانٍ لا تُشاهَد
        if (percent >= requiredPercent) setIsComplete(true)
      })
    }

    const onEnded = () => {
      void saveLessonProgress({
        lessonId,
        watchedSeconds: Math.floor(el.duration),
        progressPercent: 100,
      }).then(() => setIsComplete(true))
    }

    el.addEventListener('timeupdate', onTime)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('ended', onEnded)
    }
  }, [lessonId, watchedSeconds, requiredPercent])

  const complete = () =>
    startTransition(async () => {
      const res = await markLessonComplete(lessonId)
      if (res.ok) {
        setIsComplete(true)
        toast.success('تم تعليم الدرس كمكتمل.')
      } else {
        toast.error('تعذّر الحفظ. أعد المحاولة.')
      }
    })

  if (!entitled) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted px-6 text-center">
        <Lock className="mb-3 size-6 text-ink-faint" aria-hidden />
        <p className="text-base font-medium text-ink">هذا الدرس للمشتركين</p>
        <p className="mt-1.5 max-w-xs text-base leading-relaxed text-ink-muted">
          فعّل كود التفعيل من صفحة «مقرراتي» لفتح المقرر كاملًا.
        </p>
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted px-6 text-center">
        <VideoOff className="mb-3 size-6 text-ink-faint" aria-hidden />
        <p className="text-base font-medium text-ink">لا يوجد فيديو لهذا الدرس</p>
        <p className="mt-1.5 text-base text-ink-muted">راجع شرح الدرس والمرفقات بالأسفل.</p>
      </div>
    )
  }

  const embed = toEmbedUrl(videoUrl)
  // المستضاف داخل المنصة يصل عبر مسار موقّع لا امتداد له، فيُعرف بمقدّمه
  const isDirect =
    provider === 'self' || provider === 'bunny' || DIRECT_VIDEO.test(videoUrl)

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-brand-900">
        <VideoWatermark label={watermark} />

        {isDirect ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList={allowDownload ? undefined : 'nodownload noplaybackrate'}
            onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}
            disablePictureInPicture={!allowDownload}
            playsInline
            preload="metadata"
            className="aspect-video w-full"
          >
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        ) : embed ? (
          // مشغّلات الطرف الثالث لا تُتيح قراءة زمن المشاهدة، فالإكمال يدوي
          <span className="relative block">
            <iframe
              src={embed}
              title="مشغّل الدرس"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
              className="aspect-video w-full border-0"
            />

            {/*
             * الشريط العلوي في مشغّل يوتيوب يحمل العنوان وزرّ «مشاهدة على
             * YouTube» وزرّ المشاركة — كلها تكشف المصدر وتقود إليه.
             * غطاء شفّاف فوقه يمنع النقر، وأزرار التحكّم أسفل الإطار تبقى
             * عاملة لأن الغطاء لا يتجاوز ١٥٪ من الارتفاع.
             */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[15%] cursor-default"
              onClick={(e) => e.preventDefault()}
            />
          </span>
        ) : (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex aspect-video items-center justify-center p-6 text-center text-base text-ink-invert underline-offset-4 hover:underline"
          >
            افتح الفيديو في نافذة جديدة
          </a>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {isComplete ? (
          <p className="flex items-center gap-1.5 text-base text-success">
            <CheckCircle2 className="size-4" aria-hidden />
            أكملت هذا الدرس
          </p>
        ) : (
          <p className="text-base text-ink-faint">
            {isDirect ? 'يُحفظ تقدّمك تلقائيًا أثناء المشاهدة.' : 'علّم الدرس كمكتمل بعد مشاهدته.'}
          </p>
        )}

        {!isComplete && (
          <Button variant="secondary" size="sm" loading={pending} onClick={complete}>
            <CheckCircle2 aria-hidden />
            تعليم كمكتمل
          </Button>
        )}
      </div>
    </div>
  )
}
