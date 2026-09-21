'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Settings2,
  Video,
  VideoOff,
  Paperclip,
  Eye,
  EyeOff,
  Clock,
  Layers,
  CalendarClock,
  ClipboardList,
  Check,
  X,
} from 'lucide-react'
import { renameModule, deleteModule } from '@/lib/mutations/content'
import { moveLesson } from '@/lib/mutations/content'
import { quickAddLesson, duplicateLesson, deleteLesson } from '@/lib/mutations/lesson-manager'
import {
  LessonManagerDialog,
  type ManagedLesson,
} from '@/components/admin/lesson-manager-dialog'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/card'
import { formatNumber, formatDuration, formatDateTime, pluralAr } from '@/lib/utils/format'

export type CurriculumLesson = ManagedLesson & {
  durationSeconds: number
  hasVideo: boolean
}

export type CurriculumModule = {
  id: string | null
  title: string
  lessons: CurriculumLesson[]
}

const lessonCount = (n: number) =>
  pluralAr(n, { one: 'درس واحد', two: 'درسان', few: 'دروس', many: 'درسًا' })

const moduleCount = (n: number) =>
  pluralAr(n, { one: 'وحدة واحدة', two: 'وحدتان', few: 'وحدات', many: 'وحدة' })

const SECTION_LABEL: Record<string, string> = {
  scientific: 'علمي',
  literary: 'أدبي',
}

export function CourseCurriculum({
  courseId,
  modules,
  moduleOptions,
  bunnyEnabled,
}: {
  courseId: string
  modules: CurriculumModule[]
  moduleOptions: { id: string; title: string }[]
  bunnyEnabled: boolean
}) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(modules.map((m) => m.id ?? 'none')),
  )
  const [adding, setAdding] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [managed, setManaged] = useState<CurriculumLesson | null>(null)
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn()
      if (res.ok) {
        toast.success(res.message)
        after?.()
      } else {
        toast.error(res.message)
      }
    })

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
        <p className="nums-ar text-base text-ink-muted">
          {moduleCount(modules.filter((m) => m.id).length)} · {lessonCount(totalLessons)}
        </p>
      </div>

      <div className="divide-y divide-border-subtle">
        {modules.map((mod) => {
          const key = mod.id ?? 'none'
          const isOpen = open.has(key)

          return (
            <section key={key}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                {renaming === key && mod.id ? (
                  <>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          run(() => renameModule(mod.id!, courseId, draft), () => setRenaming(null))
                        if (e.key === 'Escape') setRenaming(null)
                      }}
                      autoFocus
                      aria-label={`اسم ${mod.title}`}
                      className="h-11 min-w-0 flex-1 rounded-[var(--radius-field)] border border-border-strong bg-surface px-3 text-base text-ink"
                    />
                    <span className="flex gap-1">
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(() => renameModule(mod.id!, courseId, draft), () => setRenaming(null))
                        }
                        aria-label="حفظ الاسم"
                      >
                        <Check aria-hidden />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setRenaming(null)} aria-label="إلغاء">
                        <X aria-hidden />
                      </Button>
                    </span>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 items-center gap-3 text-start"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-field)] bg-brand-50 text-brand-700">
                        <Layers className="size-[1.125rem]" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-semibold text-ink">
                          {mod.title}
                        </span>
                        <span className="nums-ar text-sm text-ink-faint">
                          {lessonCount(mod.lessons.length)}
                        </span>
                      </span>
                      <ChevronDown
                        className={`size-4 shrink-0 text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>

                    {mod.id && (
                      <span className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDraft(mod.title)
                            setRenaming(key)
                          }}
                          aria-label={`تعديل اسم ${mod.title}`}
                        >
                          <Pencil aria-hidden />
                        </Button>
                        <ConfirmButton
                          label=""
                          srLabel={`حذف الوحدة ${mod.title}`}
                          icon={<Trash2 aria-hidden />}
                          title="حذف الوحدة؟"
                          body={
                            mod.lessons.length > 0
                              ? `ستُحذف «${mod.title}» فقط، و${lessonCount(mod.lessons.length)} فيها تبقى كما هي لكن بلا وحدة.`
                              : `ستُحذف الوحدة «${mod.title}». لا دروس فيها.`
                          }
                          confirmLabel="احذف الوحدة"
                          action={() => deleteModule(mod.id!, courseId)}
                        />
                      </span>
                    )}
                  </>
                )}
              </div>

              {isOpen && (
                <div className="space-y-2 bg-surface-muted px-5 pb-5">
                  {mod.lessons.map((lesson, i) => (
                    <article
                      key={lesson.id}
                      className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-medium text-ink">{lesson.title}</p>

                          <p className="nums-ar mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                            <Badge tone={lesson.hasVideo ? 'info' : 'warning'}>
                              {lesson.hasVideo ? (
                                <>
                                  <Video className="size-3" aria-hidden /> فيديو
                                </>
                              ) : (
                                <>
                                  <VideoOff className="size-3" aria-hidden /> بلا فيديو
                                </>
                              )}
                            </Badge>

                            {lesson.attachments.length > 0 && (
                              <Badge tone="neutral">
                                <Paperclip className="size-3" aria-hidden />{' '}
                                {pluralAr(lesson.attachments.length, {
                                  one: 'مرفق واحد',
                                  two: 'مرفقان',
                                  few: 'مرفقات',
                                  many: 'مرفقًا',
                                })}
                              </Badge>
                            )}

                            {lesson.homework.length > 0 && (
                              <Badge
                                tone={
                                  lesson.homework.some((h) => h.isPublished) ? 'info' : 'warning'
                                }
                              >
                                <ClipboardList className="size-3" aria-hidden />{' '}
                                {pluralAr(lesson.homework.length, {
                                  one: 'واجب واحد',
                                  two: 'واجبان',
                                  few: 'واجبات',
                                  many: 'واجبًا',
                                })}
                              </Badge>
                            )}

                            {lesson.isFree && <Badge tone="success">مجاني</Badge>}
                            {lesson.section && (
                              <Badge tone="info">{SECTION_LABEL[lesson.section]}</Badge>
                            )}

                            <span className="flex items-center gap-1 text-ink-faint">
                              {lesson.isPublished ? (
                                <>
                                  <Eye className="size-3" aria-hidden /> ظاهر
                                </>
                              ) : (
                                <>
                                  <EyeOff className="size-3" aria-hidden /> مخفي
                                </>
                              )}
                            </span>

                            {lesson.durationSeconds > 0 && (
                              <span className="flex items-center gap-1 text-ink-faint">
                                <Clock className="size-3" aria-hidden />
                                {formatDuration(lesson.durationSeconds)}
                              </span>
                            )}

                            {lesson.publishAt && (
                              <span className="flex items-center gap-1 text-warning">
                                <CalendarClock className="size-3" aria-hidden />
                                يظهر {formatDateTime(lesson.publishAt)}
                              </span>
                            )}
                          </p>
                        </div>

                        <span className="flex shrink-0 flex-wrap items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={i === 0 || pending}
                            onClick={() => run(() => moveLesson(lesson.id, courseId, 'up'))}
                            aria-label={`تقديم ${lesson.title}`}
                          >
                            <ChevronUp aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={i === mod.lessons.length - 1 || pending}
                            onClick={() => run(() => moveLesson(lesson.id, courseId, 'down'))}
                            aria-label={`تأخير ${lesson.title}`}
                          >
                            <ChevronDown aria-hidden />
                          </Button>

                          <Button variant="secondary" size="sm" onClick={() => setManaged(lesson)}>
                            <Settings2 aria-hidden />
                            إدارة
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => run(() => duplicateLesson(lesson.id, courseId))}
                            aria-label={`نسخ ${lesson.title}`}
                          >
                            <Copy aria-hidden />
                          </Button>

                          <ConfirmButton
                            label=""
                            srLabel={`حذف ${lesson.title}`}
                            icon={<Trash2 aria-hidden />}
                            title="حذف الدرس؟"
                            body={`سيُحذف «${lesson.title}» بفيديوه وروابط مرفقاته. الحذف ممنوع إن كان طلاب قد شاهدوه.`}
                            confirmLabel="احذف الدرس"
                            action={() => deleteLesson(lesson.id, courseId)}
                          />
                        </span>
                      </div>
                    </article>
                  ))}

                  {adding === key ? (
                    <form
                      className="flex flex-wrap gap-2 pt-1"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!newTitle.trim()) return
                        run(() => quickAddLesson(courseId, mod.id, newTitle), () => {
                          setNewTitle('')
                          setAdding(null)
                        })
                      }}
                    >
                      <input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setAdding(null)
                        }}
                        autoFocus
                        placeholder="عنوان الدرس"
                        aria-label={`عنوان درس جديد في ${mod.title}`}
                        className="h-12 min-w-0 flex-1 rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 text-base text-ink"
                      />
                      <Button type="submit" disabled={pending || !newTitle.trim()}>
                        أضف
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setAdding(null)}>
                        إلغاء
                      </Button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAdding(key)
                        setNewTitle('')
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border-strong py-3.5 text-base text-ink-muted transition-colors hover:border-brand-300 hover:text-brand-700"
                    >
                      <Plus className="size-4" aria-hidden />
                      إضافة درس
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {managed && (
        <LessonManagerDialog
          lesson={managed}
          courseId={courseId}
          modules={moduleOptions}
          bunnyEnabled={bunnyEnabled}
          onClose={() => setManaged(null)}
        />
      )}
    </>
  )
}
