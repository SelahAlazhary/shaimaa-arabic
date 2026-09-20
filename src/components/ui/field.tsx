'use client'

import * as React from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * حقل نموذج كامل: تسمية + مدخل + خطأ + تلميح.
 * Placeholder ليس بديلًا عن Label (البند 15) — التسمية إلزامية دائمًا.
 */

type FieldProps = {
  label: string
  error?: string | undefined
  hint?: string | undefined
  required?: boolean
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode
}

export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = React.useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-medium text-ink">
        {label}
        {required && (
          <span className="text-danger" aria-label="مطلوب">
            {' '}
            *
          </span>
        )}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-base text-danger">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-base text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const inputBase = [
  'block w-full rounded-[var(--radius-field)] border bg-surface px-3.5 text-base text-ink',
  'h-11 placeholder:text-ink-faint',
  'transition-[border-color,box-shadow] duration-150',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint',
]

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase,
        invalid ? 'border-danger' : 'border-border-strong hover:border-ink-faint',
        className,
      )}
      {...props}
    />
  )
})

/** مدخل كلمة مرور بزر إظهار/إخفاء (البند 15). */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function PasswordInput({ className, invalid, ...props }, ref) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        className={cn(
          inputBase,
          'ps-3.5 pe-11',
          invalid ? 'border-danger' : 'border-border-strong hover:border-ink-faint',
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 end-0 grid w-11 place-items-center text-ink-faint hover:text-ink"
        aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  )
})

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase,
        'appearance-none bg-[length:1rem] bg-[position:left_0.875rem_center] bg-no-repeat pe-3.5 ps-10',
        "bg-[url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%236B736F'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3e%3c/svg%3e\")]",
        invalid ? 'border-danger' : 'border-border-strong hover:border-ink-faint',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})
