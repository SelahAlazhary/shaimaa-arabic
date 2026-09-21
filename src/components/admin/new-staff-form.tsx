'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { UserPlus, AlertCircle, Copy, Check, RefreshCw } from 'lucide-react'
import { createStaffAccount, type StaffState } from '@/lib/mutations/staff'
import { Field, Input, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

const initial: StaffState = { status: 'idle' }

const ROLES = [
  {
    value: 'support',
    label: 'فريق الدعم',
    scope: 'يقرأ الطلاب والمقررات ويردّ على المحادثات. لا يُنشئ محتوى ولا يولّد أكوادًا ولا يحذف.',
  },
  {
    value: 'admin',
    label: 'مدير',
    scope: 'صلاحية كاملة على المحتوى والطلاب والأكواد. لا يستطيع ترقية مديرين. (يحتاج حساب مدير عام لإنشائه)',
  },
] as const

/** كلمة مرور قوية مولَّدة: ١٦ محرفًا بلا محارف يلتبس شكلها. */
function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'
  const bytes = crypto.getRandomValues(new Uint32Array(16))
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('')
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} loadingText="جارٍ الإنشاء…">
      <UserPlus aria-hidden />
      أنشئ الحساب
    </Button>
  )
}

export function NewStaffForm() {
  const [state, formAction] = useActionState(createStaffAccount, initial)
  const [open, setOpen] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'support' | 'admin'>('support')
  const [copied, setCopied] = useState(false)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message)
      setFullName('')
      setEmail('')
      setPassword('')
      setRole('support')
      setOpen(false)
      setFormKey((k) => k + 1)
    }
    // React يُفرغ النموذج بعد كل Server Action؛ الـkey يعيد بناءه بقيم الحالة
    if (state.status === 'error') setFormKey((k) => k + 1)
  }, [state])

  const copy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('تعذّر النسخ. حدّد كلمة المرور وانسخها يدويًّا.')
    }
  }

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined
  const chosen = ROLES.find((r) => r.value === role)

  if (!open) {
    return (
      <div className="border-b border-border-subtle p-5">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <UserPlus aria-hidden />
          حساب جديد بصلاحية
        </Button>
      </div>
    )
  }

  return (
    <form
      key={formKey}
      action={formAction}
      className="space-y-4 border-b border-border-subtle bg-surface-muted p-5"
      noValidate
    >
      <h3 className="text-base font-semibold text-ink">حساب جديد بصلاحية</h3>

      {generalError && (
        <p role="alert" className="flex items-center gap-1.5 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {generalError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم" error={fieldErrors?.fullName} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
          )}
        </Field>

        <Field label="البريد الإلكتروني" error={fieldErrors?.email} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="email"
              type="email"
              dir="ltr"
              className="text-start"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
          )}
        </Field>
      </div>

      <Field
        label="كلمة المرور"
        error={fieldErrors?.password}
        hint="١٠ أحرف على الأقل، فيها حرف ورقم. انسخها وسلّمها لصاحب الحساب — لن تظهر بعد الحفظ."
        required
      >
        {({ id, describedBy, invalid }) => (
          <div className="flex gap-2">
            <Input
              id={id}
              name="password"
              dir="ltr"
              className="text-start"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPassword(generatePassword())}
              aria-label="ولّد كلمة مرور قوية"
            >
              <RefreshCw aria-hidden />
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={copy}
              disabled={!password}
              aria-label="انسخ كلمة المرور"
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            </Button>
          </div>
        )}
      </Field>

      <Field label="الصلاحية" error={fieldErrors?.role} hint={chosen?.scope} required>
        {({ id, describedBy, invalid }) => (
          <Select
            id={id}
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'support' | 'admin')}
            aria-describedby={describedBy}
            invalid={invalid}
            required
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="flex flex-wrap gap-2.5">
        <SubmitButton />
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          إلغاء
        </Button>
      </div>
    </form>
  )
}
