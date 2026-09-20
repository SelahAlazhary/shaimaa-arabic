'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Ticket, AlertCircle, Copy } from 'lucide-react'
import { generateCodes, type GenerateState } from '@/lib/mutations/codes'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: GenerateState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ التوليد…">
      <Ticket aria-hidden />
      توليد
    </Button>
  )
}

export function GenerateCodesForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, formAction] = useActionState(generateCodes, initial)

  useEffect(() => {
    if (state.status === 'success') toast.success(state.message)
  }, [state])

  const copyAll = async () => {
    if (state.status !== 'success') return
    try {
      await navigator.clipboard.writeText(state.codes.join('\n'))
      toast.success('تم نسخ الأكواد.')
    } catch {
      toast.error('تعذّر النسخ. حدّد الأكواد وانسخها يدويًا.')
    }
  }

  return (
    <div className="p-5">
      {courses.length === 0 ? (
        <p className="text-sm text-ink-muted">
          أنشئ كورسًا أولًا، فالأكواد تُولَّد لكورس محدّد.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الكورس" required>
              {({ id, invalid }) => (
                <Select id={id} name="courseId" defaultValue="" invalid={invalid} required>
                  <option value="" disabled>
                    اختر الكورس
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="عدد الأكواد" hint="من ١ إلى ٥٠٠" required>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  name="quantity"
                  type="number"
                  min={1}
                  max={500}
                  defaultValue={50}
                  dir="ltr"
                  className="text-start"
                  aria-describedby={describedBy}
                  invalid={invalid}
                  required
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="مدة الاشتراك بالأيام" hint="اتركه فارغًا لاشتراك بلا نهاية">
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  name="grantsDays"
                  type="number"
                  min={1}
                  placeholder="90"
                  dir="ltr"
                  className="text-start"
                  aria-describedby={describedBy}
                  invalid={invalid}
                />
              )}
            </Field>

            <Field label="اسم الدفعة" hint="يساعدك في تتبّع أكواد كل توزيعة">
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  name="batch"
                  placeholder="مثال: دفعة سبتمبر"
                  aria-describedby={describedBy}
                  invalid={invalid}
                />
              )}
            </Field>
          </div>

          {state.status === 'error' && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {state.message}
            </p>
          )}

          <SubmitButton />

          {state.status === 'success' && state.codes.length > 0 && (
            <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">{state.message}</p>
                <Button type="button" variant="secondary" size="sm" onClick={copyAll}>
                  <Copy aria-hidden />
                  نسخ الكل
                </Button>
              </div>
              <pre
                dir="ltr"
                className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-ink-muted"
              >
                {state.codes.join('\n')}
              </pre>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
