'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  X,
  FileText,
  Video,
  Paperclip,
  Upload,
  Link2,
  Trash2,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  saveLessonContent,
  saveLessonVideo,
  removeLessonVideo,
  addLinkAttachment,
} from '@/lib/mutations/lesson-manager'
import { unlinkAttachmentFromLesson } from '@/lib/mutations/attachments'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { formatFileSize, formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export type ManagedLesson = {
  id: string
  title: string
  description: string
  moduleId: string | null
  durationMinutes: string
  isFree: boolean
  isPublished: boolean
  section: '' | 'scientific' | 'literary'
  publishAt: string
  video: {
    storagePath: string | null
    url: string
    requiredPercent: number
    allowDownload: boolean
  } | null
  attachments: { id: string; title: string; size: number | null; isLink: boolean }[]
}

const TABS = [
  { id: 'content', label: 'المحتوى', icon: FileText },
  { id: 'video', label: 'الفيديو', icon: Video },
  { id: 'files', label: 'المرفقات', icon: Paperclip },
] as const

type TabId = (typeof TABS)[number]['id']

/**
 * الموعد يصل من الخادم بصيغة ISO بالتوقيت العالمي،
 * وحقل datetime-local يقرأ توقيت المتصفّح — فيُحوَّل هنا لا على الخادم.
 */
function toLocalInput(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function LessonManagerDialog({
  lesson,
  courseId,
  modules,
  onClose,
}: {
  lesson: ManagedLesson
  courseId: string
  modules: { id: string; title: string }[]
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<TabId>('content')
  const [pending, start] = useTransition()

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    el.showModal()

    /*
     * حدث close لا يصعد، وReact لا يلتقطه بالتفويض — فيُربط على العنصر.
     * بدونه يبقى الأب ظانًّا أن الحوار مفتوح بعد Esc فلا يُفتح ثانية.
     */
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== المحتوى =====
  const [title, setTitle] = useState(lesson.title)
  const [description, setDescription] = useState(lesson.description)
  const [moduleId, setModuleId] = useState(lesson.moduleId ?? '')
  const [duration, setDuration] = useState(lesson.durationMinutes)
  const [isFree, setIsFree] = useState(lesson.isFree)
  const [isPublished, setIsPublished] = useState(lesson.isPublished)
  const [section, setSection] = useState(lesson.section)
  const [publishAt, setPublishAt] = useState(() => toLocalInput(lesson.publishAt))

  const saveContent = () =>
    start(async () => {
      const res = await saveLessonContent({
        lessonId: lesson.id,
        courseId,
        title,
        description,
        moduleId: moduleId || null,
        durationMinutes: duration,
        isFree,
        isPublished,
        section,
        publishAt,
      })
      if (res.ok) {
        toast.success(res.message)
        onClose()
      } else {
        toast.error(res.message)
      }
    })

  // ===== الفيديو =====
  const [videoUrl, setVideoUrl] = useState(lesson.video?.url ?? '')
  const [storagePath, setStoragePath] = useState(lesson.video?.storagePath ?? null)
  const [percent, setPercent] = useState(lesson.video?.requiredPercent ?? 90)
  const [allowDownload, setAllowDownload] = useState(lesson.video?.allowDownload ?? false)
  const [progress, setProgress] = useState<number | null>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  /*
   * الرفع يمضي من المتصفّح إلى التخزين مباشرة، لا عبر الخادم:
   * Server Action لها حدّ حجم للجسم، ومحاضرة بحجم جيجابايت تتجاوزه.
   */
  const uploadVideo = (file: File | undefined) => {
    if (!file) return

    start(async () => {
      setProgress(0)
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
      const path = `${lesson.id}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from('lesson-videos')
        .upload(path, file, { contentType: file.type, upsert: false })

      setProgress(null)
      if (videoInput.current) videoInput.current.value = ''

      if (error) {
        toast.error('تعذّر رفع الفيديو. تأكّد من الصيغة والحجم.')
        return
      }

      setStoragePath(path)
      setVideoUrl('')

      /*
       * الربط يجري فور الرفع لا بضغطة تالية: الملف صار في التخزين، فإن
       * أُغلقت النافذة قبل الحفظ بقي معلّقًا لا يشير إليه درس ولا يُحذف.
       */
      const res = await saveLessonVideo({
        lessonId: lesson.id,
        courseId,
        storagePath: path,
        videoUrl: '',
        requiredPercent: percent,
        allowDownload,
      })

      if (res.ok) {
        toast.success('رُفع الفيديو ورُبط بالدرس.')
        return
      }

      // فشل الربط يترك ملفًا لا يشير إليه درس ولا يحذفه شيء — فيُزال فورًا
      await supabase.storage.from('lesson-videos').remove([path])
      setStoragePath(lesson.video?.storagePath ?? null)
      setVideoUrl(lesson.video?.url ?? '')
      toast.error(res.message)
    })
  }

  const saveVideo = () =>
    start(async () => {
      const res = await saveLessonVideo({
        lessonId: lesson.id,
        courseId,
        storagePath,
        videoUrl,
        requiredPercent: percent,
        allowDownload,
      })
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  const dropVideo = () =>
    start(async () => {
      const res = await removeLessonVideo(lesson.id, courseId)
      if (res.ok) {
        setStoragePath(null)
        setVideoUrl('')
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    })

  // ===== المرفقات =====
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const addLink = () =>
    start(async () => {
      const res = await addLinkAttachment(lesson.id, courseId, linkTitle, linkUrl)
      if (res.ok) {
        toast.success(res.message)
        setLinkTitle('')
        setLinkUrl('')
      } else {
        toast.error(res.message)
      }
    })

  const dropFile = (attachmentId: string) =>
    start(async () => {
      const res = await unlinkAttachmentFromLesson(attachmentId, lesson.id)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(46rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] border border-border-subtle bg-surface p-0 text-ink shadow-[var(--shadow-pop)] backdrop:bg-ink/40"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle p-5">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">إدارة الدرس</h2>
          <p className="mt-0.5 truncate text-base text-ink-muted">{lesson.title}</p>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="إغلاق"
          className="tap-target grid shrink-0 place-items-center rounded-[var(--radius-field)] text-ink-faint hover:bg-surface-muted hover:text-ink"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div
        role="tablist"
        aria-label="أقسام إدارة الدرس"
        className="flex gap-1 border-b border-border-subtle p-3"
      >
        {TABS.map(({ id, label, icon: Icon }, i) => (
          <button
            key={id}
            id={`lesson-tab-${id}`}
            role="tab"
            type="button"
            aria-selected={tab === id}
            aria-controls="lesson-tabpanel"
            // تنقّل السهم: العنصر غير المختار يخرج من ترتيب Tab
            tabIndex={tab === id ? 0 : -1}
            onKeyDown={(e) => {
              // الاتجاه من اليمين لليسار: السهم الأيسر يتقدّم
              const step = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0
              if (!step) return
              e.preventDefault()
              const next = TABS[(i + step + TABS.length) % TABS.length]!
              setTab(next.id)
              document.getElementById(`lesson-tab-${next.id}`)?.focus()
            }}
            onClick={() => setTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-field)] px-3 py-2.5 text-base transition-colors',
              tab === id
                ? 'bg-brand-800 font-medium text-ink-invert'
                : 'text-ink-muted hover:bg-surface-muted',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {id === 'files' && ` (${formatNumber(lesson.attachments.length)})`}
          </button>
        ))}
      </div>

      <div
        id="lesson-tabpanel"
        role="tabpanel"
        aria-labelledby={`lesson-tab-${tab}`}
        tabIndex={0}
        className="max-h-[60vh] overflow-y-auto p-5"
      >
        {tab === 'content' && (
          <div className="space-y-4">
            <Field label="عنوان الدرس" required>
              {({ id }) => (
                <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} required />
              )}
            </Field>

            <Field label="شرح الدرس" hint="ما يتعلّمه الطالب هنا — يظهر أسفل المشغّل">
              {({ id }) => (
                <textarea
                  id={id}
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink"
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الوحدة">
                {({ id }) => (
                  <Select id={id} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
                    <option value="">بلا وحدة</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="المدة بالدقائق">
                {({ id }) => (
                  <Input
                    id={id}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    inputMode="numeric"
                    dir="ltr"
                    className="text-start"
                  />
                )}
              </Field>
            </div>

            <Field
              label="القسم المستهدف"
              hint="يتحكّم في ظهور الدرس: للعلمي وحده، أو الأدبي، أو للقسمين معًا"
            >
              {({ id }) => (
                <Select
                  id={id}
                  value={section}
                  onChange={(e) => setSection(e.target.value as ManagedLesson['section'])}
                >
                  <option value="">القسمان (الكل)</option>
                  <option value="scientific">علمي فقط</option>
                  <option value="literary">أدبي فقط</option>
                </Select>
              )}
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-2.5 rounded-[var(--radius-field)] border border-border-subtle p-4">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border-strong"
                />
                <span>
                  <span className="block text-base font-medium text-ink">منشور</span>
                  <span className="block text-sm text-ink-muted">يظهر الدرس للطالب</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 rounded-[var(--radius-field)] border border-border-subtle p-4">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border-strong"
                />
                <span>
                  <span className="block text-base font-medium text-ink">معاينة مجانية</span>
                  <span className="block text-sm text-ink-muted">متاح دون اشتراك</span>
                </span>
              </label>
            </div>

            <Field
              label="جدولة النشر"
              hint="اتركه فارغًا للنشر الفوري، أو حدّد موعدًا يظهر فيه الدرس تلقائيًّا"
            >
              {({ id }) => (
                <Input
                  id={id}
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  dir="ltr"
                  className="text-start"
                />
              )}
            </Field>

            <Button loading={pending} loadingText="جارٍ الحفظ…" onClick={saveContent}>
              حفظ الدرس
            </Button>
          </div>
        )}

        {tab === 'video' && (
          <div className="space-y-4">
            {storagePath ? (
              <p className="flex items-center gap-2 rounded-[var(--radius-field)] bg-success-bg px-3.5 py-3 text-base text-success">
                <Video className="size-4 shrink-0" aria-hidden />
                الفيديو مستضاف داخل المنصة — لا يظهر مصدره للطالب.
              </p>
            ) : (
              <p className="text-base leading-[1.9] text-ink-muted">
                ارفع الملف ليُستضاف داخل المنصة (الأفضل: لا يظهر مصدره ولا يُشارَك
                رابطه)، أو ضع رابطًا خارجيًّا إن كان الفيديو على منصّة أخرى.
              </p>
            )}

            <input
              ref={videoInput}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="sr-only"
              onChange={(e) => uploadVideo(e.target.files?.[0])}
            />

            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="secondary"
                loading={pending && progress !== null}
                loadingText="جارٍ الرفع…"
                onClick={() => videoInput.current?.click()}
              >
                <Upload aria-hidden />
                {storagePath ? 'استبدل الملف' : 'ارفع ملف الفيديو'}
              </Button>

              {(storagePath || lesson.video) && (
                <Button variant="ghost" disabled={pending} onClick={dropVideo}>
                  <Trash2 aria-hidden />
                  احذف الفيديو
                </Button>
              )}
            </div>

            {!storagePath && (
              <Field label="أو رابط خارجي" hint="يوتيوب أو فيميو أو رابط mp4 مباشر">
                {({ id }) => (
                  <Input
                    id={id}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    dir="ltr"
                    className="text-start"
                  />
                )}
              </Field>
            )}

            <Field
              label={`نسبة المشاهدة المطلوبة لإكمال الدرس: ${formatNumber(percent)}٪`}
              hint="يُعلَّم الدرس مكتملًا تلقائيًّا عند بلوغ هذه النسبة"
            >
              {({ id }) => (
                <input
                  id={id}
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="w-full accent-brand-700"
                />
              )}
            </Field>

            <label className="flex items-start gap-2.5 rounded-[var(--radius-field)] border border-border-subtle p-4">
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border-strong"
              />
              <span>
                <span className="flex items-center gap-1.5 text-base font-medium text-ink">
                  <ShieldCheck className="size-4" aria-hidden />
                  السماح بالتحميل
                </span>
                <span className="block text-sm leading-relaxed text-ink-muted">
                  الافتراضي ممنوع. المنع يُخفي زرّ التحميل ولا يمنع تسجيل الشاشة —
                  العلامة المائية باسم الطالب هي ما يردع التسريب.
                </span>
              </span>
            </label>

            <Button loading={pending && progress === null} loadingText="جارٍ الحفظ…" onClick={saveVideo}>
              حفظ الفيديو
            </Button>
          </div>
        )}

        {tab === 'files' && (
          <div className="space-y-5">
            <div className="rounded-[var(--radius-card)] border border-border-subtle p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
                <Link2 className="size-4" aria-hidden />
                إضافة رابط خارجي
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="عنوان الرابط"
                  aria-label="عنوان الرابط"
                />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  dir="ltr"
                  className="text-start"
                  placeholder="https://…"
                  aria-label="عنوان URL"
                />
              </div>
              <Button
                variant="secondary"
                className="mt-3"
                disabled={pending || !linkTitle.trim() || !linkUrl.trim()}
                onClick={addLink}
              >
                أضف الرابط
              </Button>
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">مرفقات هذا الدرس</h3>
              {lesson.attachments.length === 0 ? (
                <p className="rounded-[var(--radius-card)] border border-dashed border-border-strong p-6 text-center text-base text-ink-muted">
                  لا مرفقات بعد. ارفع ملفًا من صفحة «المرفقات» واربطه بالدرس، أو أضف
                  رابطًا من الأعلى.
                </p>
              ) : (
                <ul className="divide-y divide-border-subtle rounded-[var(--radius-card)] border border-border-subtle">
                  {lesson.attachments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 p-4">
                      <span className="min-w-0">
                        <span className="block truncate text-base font-medium text-ink">
                          {a.title}
                        </span>
                        <span className="nums-ar text-sm text-ink-faint">
                          {a.isLink ? 'رابط خارجي' : formatFileSize(a.size ?? 0)}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => dropFile(a.id)}
                        aria-label={`فكّ ربط ${a.title}`}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </dialog>
  )
}
