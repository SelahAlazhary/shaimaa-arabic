'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Upload, AlertCircle, FileText, X } from 'lucide-react'
import { uploadAttachment, type UploadState } from '@/lib/mutations/attachments'
import { MAX_FILE_BYTES, ACCEPTED_UPLOAD_TYPES } from '@/lib/constants/uploads'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils/format'

const initial: UploadState = { status: 'idle' }

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الرفع…" disabled={disabled}>
      <Upload aria-hidden />
      رفع المرفق
    </Button>
  )
}

export function AttachmentUploadForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, formAction] = useActionState(uploadAttachment, initial)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [formKey, setFormKey] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message)
      setTitle('')
      setFile(null)
      setSelected([])
      setFormKey((k) => k + 1)
    }
    if (state.status === 'error') setFormKey((k) => k + 1)
  }, [state])

  const tooBig = file !== null && file.size > MAX_FILE_BYTES

  const toggleCourse = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <form key={formKey} action={formAction} className="space-y-4 p-5" noValidate>
      <Field label="عنوان المرفق" required>
        {({ id, invalid }) => (
          <Input
            id={id}
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: مذكرة النحو — الوحدة الأولى"
            invalid={invalid}
            required
          />
        )}
      </Field>

      <div>
        <label htmlFor="attachment-file" className="mb-1.5 block text-sm font-medium text-ink">
          الملف <span className="text-danger">*</span>
        </label>

        {file ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-field)] border border-border-strong bg-surface-muted px-3.5 py-2.5">
            <FileText className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{file.name}</span>
              <span className={`nums-ar block text-xs ${tooBig ? 'text-danger' : 'text-ink-faint'}`}>
                {formatFileSize(file.size)}
                {tooBig && ' — أكبر من الحد المسموح'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setFile(null)
                if (fileRef.current) fileRef.current.value = ''
              }}
              className="tap-target grid place-items-center text-ink-faint hover:text-ink"
              aria-label="إزالة الملف"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}

        <input
          ref={fileRef}
          id="attachment-file"
          name="file"
          type="file"
          accept={ACCEPTED_UPLOAD_TYPES}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
          className={[
            'mt-2 block w-full text-sm text-ink-muted',
            'file:me-3 file:rounded-[var(--radius-field)] file:border file:border-border-strong',
            'file:bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink',
            'hover:file:bg-surface-muted',
            file ? 'sr-only' : '',
          ].join(' ')}
        />

        <p className="mt-1.5 text-xs text-ink-faint">PDF أو صورة JPG/PNG · حتى ١٠٠ ميجابايت.</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">
          اربطه بالكورسات
          <span className="ms-2 text-xs font-normal text-ink-faint">
            المرفق لا يظهر لأي طالب حتى تربطه بكورس
          </span>
        </legend>

        {courses.length === 0 ? (
          <p className="text-sm text-ink-muted">أنشئ كورسًا أولًا لتربط به المرفقات.</p>
        ) : (
          <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-[var(--radius-field)] border border-border-subtle p-3">
            {courses.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  name="courseIds"
                  value={c.id}
                  checked={selected.includes(c.id)}
                  onChange={() => toggleCourse(c.id)}
                  className="size-4 rounded border-border-strong"
                />
                <span className="text-sm text-ink">{c.title}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {state.status === 'error' && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <SubmitButton disabled={tooBig} />
    </form>
  )
}
