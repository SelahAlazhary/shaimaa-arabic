'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { register, type ActionState } from '@/lib/mutations/auth'
import { SECTIONS, PHONE_LENGTH } from '@/lib/validations/auth'
import { Field, Input, PasswordInput, Select } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import type { RegistrationReference } from '@/lib/queries/reference'

const initial: ActionState = { status: 'idle' }

type Values = {
  fullName: string
  email: string
  phone: string
  stageId: string
  gradeId: string
  governorateId: string
  section: string
  schoolName: string
  password: string
  confirmPassword: string
}

const EMPTY: Values = {
  fullName: '',
  email: '',
  phone: '',
  stageId: '',
  gradeId: '',
  governorateId: '',
  section: '',
  schoolName: '',
  password: '',
  confirmPassword: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" block loading={pending} loadingText="جارٍ إنشاء الحساب…">
      إنشاء الحساب
    </Button>
  )
}

export function RegisterForm({ reference }: { reference: RegistrationReference }) {
  const { stages, grades, governorates } = reference
  const [state, formAction] = useActionState(register, initial)

  /**
   * الحقول متحكَّم فيها عمدًا.
   * React يُصفّر أي نموذج بعد تنفيذ Server Action — وهو سلوك مقصود منه —
   * فالحقول غير المتحكَّم فيها تُفرَّغ مع كل خطأ ويضيع ما كتبه المستخدم.
   * إبقاء القيم في حالة المكوّن يحفظها عبر كل محاولة (البند 15).
   */
  const [values, setValues] = useState<Values>(EMPTY)

  /**
   * React يستدعي form.reset() بعد الإجراء. الحقول النصية تُستعاد من الحالة،
   * لكن <select> يعود بصريًا إلى خيار البداية لأن قيمته في الحالة لم تتغيّر
   * فلا يُعيد React كتابتها في الـDOM. إعادة التركيب بمفتاح جديد تُزامنها كلها.
   */
  const [formKey, setFormKey] = useState(0)
  useEffect(() => {
    if (state.status === 'error') setFormKey((k) => k + 1)
  }, [state])

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  // الهاتف: أرقام فقط وبطول ثابت. التنظيف عند الكتابة أوضح من رسالة خطأ بعد الإرسال
  const setPhone = (raw: string) =>
    set('phone', raw.replace(/\D/g, '').slice(0, PHONE_LENGTH))

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const generalError = state.status === 'error' && !fieldErrors ? state.message : undefined

  const stageGrades = useMemo(
    () => (values.stageId ? grades.filter((g) => g.stage_id === values.stageId) : []),
    [values.stageId, grades],
  )
  const requiresSection = stages.find((s) => s.id === values.stageId)?.requiresSection ?? false

  // تغيير المرحلة يُبطل الصف المختار: الصف القديم لا يتبع المرحلة الجديدة
  const onStageChange = (stageId: string) =>
    setValues((prev) => ({ ...prev, stageId, gradeId: '', section: '' }))

  const phoneComplete = values.phone.length === PHONE_LENGTH

  return (
    <form key={formKey} action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="stageRequiresSection" value={requiresSection ? 'yes' : 'no'} />

      {generalError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius-card)] bg-danger-bg p-3.5 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{generalError}</span>
        </div>
      )}

      <Field label="الاسم بالكامل" error={fieldErrors?.fullName} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="fullName"
            value={values.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            autoComplete="name"
            placeholder="مثال: فاطمة محمد عبد الله"
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
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            className="text-start"
            placeholder="name@example.com"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <Field
        label="رقم الموبايل"
        error={fieldErrors?.phone}
        hint={
          phoneComplete
            ? 'نستخدمه للتواصل معك عند وجود مشكلة في الاشتراك.'
            : `أرقام فقط · ${values.phone.length} من ${PHONE_LENGTH}`
        }
        required
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="phone"
            type="tel"
            value={values.phone}
            onChange={(e) => setPhone(e.target.value)}
            onPaste={(e) => {
              // اللصق من جهات الاتصال يأتي بمسافات وشرطات و+20
              e.preventDefault()
              setPhone(values.phone + e.clipboardData.getData('text'))
            }}
            inputMode="numeric"
            autoComplete="tel"
            maxLength={PHONE_LENGTH}
            dir="ltr"
            className="text-start tracking-wider"
            placeholder="01012345678"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="المرحلة الدراسية" error={fieldErrors?.stageId} required>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              name="stageId"
              value={values.stageId}
              onChange={(e) => onStageChange(e.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            >
              <option value="" disabled>
                اختر المرحلة
              </option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="الصف الدراسي"
          error={fieldErrors?.gradeId}
          hint={values.stageId ? undefined : 'اختر المرحلة أولًا'}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              name="gradeId"
              value={values.gradeId}
              onChange={(e) => set('gradeId', e.target.value)}
              disabled={!values.stageId}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            >
              <option value="" disabled>
                اختر الصف
              </option>
              {stageGrades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="المحافظة" error={fieldErrors?.governorateId} required>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              name="governorateId"
              value={values.governorateId}
              onChange={(e) => set('governorateId', e.target.value)}
              aria-describedby={describedBy}
              invalid={invalid}
              required
            >
              <option value="" disabled>
                اختر المحافظة
              </option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {/* الشعبة للثانوي فقط — المرحلة الإعدادية ليس فيها علمي وأدبي */}
        {requiresSection ? (
          <Field label="الشعبة" error={fieldErrors?.section} required>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                name="section"
                value={values.section}
                onChange={(e) => set('section', e.target.value)}
                aria-describedby={describedBy}
                invalid={invalid}
                required
              >
                <option value="" disabled>
                  اختر الشعبة
                </option>
                {SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : (
          <input type="hidden" name="section" value="" />
        )}
      </div>

      <Field label="اسم المدرسة" error={fieldErrors?.schoolName} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="schoolName"
            value={values.schoolName}
            onChange={(e) => set('schoolName', e.target.value)}
            autoComplete="organization"
            placeholder="مثال: مدرسة الشهيد أحمد منسي الثانوية"
            aria-describedby={describedBy}
            invalid={invalid}
            required
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="كلمة المرور" error={fieldErrors?.password} hint="٨ أحرف على الأقل." required>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              name="password"
              value={values.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              className="text-start"
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
          )}
        </Field>

        <Field label="تأكيد كلمة المرور" error={fieldErrors?.confirmPassword} required>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              className="text-start"
              aria-describedby={describedBy}
              invalid={invalid}
              required
            />
          )}
        </Field>
      </div>

      <p className="text-sm text-ink-faint">كل الحقول مطلوبة.</p>

      <SubmitButton />
    </form>
  )
}
