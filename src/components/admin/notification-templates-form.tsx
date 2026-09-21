'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Save, Plus } from 'lucide-react'
import { saveNotificationTemplate } from '@/lib/mutations/settings'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils/format'

export type TemplateRow = {
  key: string
  label: string
  description: string
  title: string
  body: string
  placeholders: string[]
  updatedAt: string
}

export function NotificationTemplatesForm({ templates }: { templates: TemplateRow[] }) {
  return (
    <div className="divide-y divide-border-subtle">
      {templates.map((tpl) => (
        <TemplateEditor key={tpl.key} template={tpl} />
      ))}
    </div>
  )
}

function TemplateEditor({ template }: { template: TemplateRow }) {
  const [title, setTitle] = useState(template.title)
  const [body, setBody] = useState(template.body)
  const [pending, start] = useTransition()

  const dirty = title !== template.title || body !== template.body

  const save = () =>
    start(async () => {
      const res = await saveNotificationTemplate({ key: template.key, title, body })
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })

  /** يُدرج المتغيّر في نهاية النص بدل أن يكتبه المشرف يدويًّا فيخطئ فيه. */
  const insert = (name: string) => setBody((b) => `${b}${b.endsWith(' ') || !b ? '' : ' '}{{${name}}}`)

  return (
    <section className="space-y-4 p-5">
      <div>
        <h3 className="text-base font-semibold text-ink">{template.label}</h3>
        <p className="mt-0.5 text-base text-ink-muted">{template.description}</p>
      </div>

      <Field label="عنوان الإشعار" required>
        {({ id }) => (
          <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} required />
        )}
      </Field>

      <Field label="نصّ الإشعار">
        {({ id }) => (
          <textarea
            id={id}
            rows={3}
            maxLength={500}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="block w-full rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 py-2.5 text-base leading-relaxed text-ink"
          />
        )}
      </Field>

      {template.placeholders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base text-ink-muted">المتغيّرات المتاحة:</span>
          {template.placeholders.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => insert(name)}
              dir="ltr"
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-surface-muted px-2.5 py-1 font-mono text-sm text-ink-muted transition-colors hover:bg-brand-100 hover:text-brand-700"
            >
              <Plus className="size-3" aria-hidden />
              {`{{${name}}}`}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button loading={pending} loadingText="جارٍ الحفظ…" disabled={!dirty} onClick={save}>
          <Save aria-hidden />
          حفظ القالب
        </Button>
        <span className="nums-ar text-sm text-ink-faint">
          آخر تحديث {formatDateTime(template.updatedAt)}
        </span>
      </div>
    </section>
  )
}
