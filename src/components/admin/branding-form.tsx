'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { AlertCircle, Save } from 'lucide-react'
import { saveBranding, type SettingsState } from '@/lib/mutations/settings'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: SettingsState = { status: 'idle' }

export type BrandingDefaults = {
  site_name: string
  code_prefix: string
  support_email: string
  support_phone: string
  whatsapp: string
  facebook: string
  youtube: string
  telegram: string
  instagram: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الحفظ…">
      <Save aria-hidden />
      حفظ الإعدادات
    </Button>
  )
}

export function BrandingForm({ defaults }: { defaults: BrandingDefaults }) {
  const [state, formAction] = useActionState(saveBranding, initial)
  const [values, setValues] = useState(defaults)

  // React يُصفّر النموذج بعد الإجراء، فالقيم في الحالة والمفتاح يُعيد التركيب
  const [formKey, setFormKey] = useState(0)
  useEffect(() => {
    if (state.status === 'error') setFormKey((k) => k + 1)
    if (state.status === 'success') toast.success(state.message)
  }, [state])

  const set = (k: keyof BrandingDefaults, v: string) => setValues((p) => ({ ...p, [k]: v }))

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  return (
    <form key={formKey} action={formAction} className="space-y-6 p-5" noValidate>
      {generalError && (
        <p role="alert" className="flex items-center gap-2 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {generalError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم المنصة" error={fieldErrors?.site_name} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="site_name"
              value={values.site_name}
              onChange={(e) => set('site_name', e.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
          )}
        </Field>

        <Field
          label="بادئة أكواد التفعيل"
          hint="تظهر في أول كل كود — حروف إنجليزية وأرقام"
          error={fieldErrors?.code_prefix}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="code_prefix"
              dir="ltr"
              className="font-mono"
              value={values.code_prefix}
              onChange={(e) => set('code_prefix', e.target.value.toUpperCase())}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
          )}
        </Field>
      </div>

      <fieldset className="space-y-4 border-t border-border-subtle pt-5">
        <legend className="sr-only">بيانات التواصل</legend>
        <h3 className="text-base font-semibold text-ink">بيانات التواصل</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="بريد الدعم" error={fieldErrors?.support_email}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="support_email"
                type="email"
                dir="ltr"
                value={values.support_email}
                onChange={(e) => set('support_email', e.target.value)}
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="هاتف الدعم" error={fieldErrors?.support_phone}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="support_phone"
                type="tel"
                dir="ltr"
                value={values.support_phone}
                onChange={(e) => set('support_phone', e.target.value)}
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field
            label="رقم واتساب"
            hint="بصيغة دولية، مثل ‎+201234567890"
            error={fieldErrors?.whatsapp}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="whatsapp"
                type="tel"
                dir="ltr"
                value={values.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-border-subtle pt-5">
        <legend className="sr-only">الروابط الاجتماعية</legend>
        <h3 className="text-base font-semibold text-ink">الروابط الاجتماعية</h3>
        <p className="text-base text-ink-faint">
          اتركه فارغًا ليختفي الرابط من تذييل الموقع. كل رابط يبدأ بـ https.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['facebook', 'فيسبوك'],
              ['youtube', 'يوتيوب'],
              ['telegram', 'تيليجرام'],
              ['instagram', 'إنستجرام'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} error={fieldErrors?.[key]}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  name={key}
                  type="url"
                  dir="ltr"
                  value={values[key]}
                  onChange={(e) => set(key, e.target.value)}
                  aria-describedby={describedBy}
                  invalid={invalid}
                />
              )}
            </Field>
          ))}
        </div>
      </fieldset>

      <SubmitButton />
    </form>
  )
}
