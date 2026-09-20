import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const button = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-[var(--radius-field)] font-medium',
    'transition-[background-color,border-color,color,box-shadow] duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:size-[1.125em] [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-brand-700 text-ink-invert hover:bg-brand-800 active:bg-brand-900',
        secondary:
          'bg-surface text-ink border border-border-strong hover:bg-surface-muted active:bg-canvas',
        ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
        danger: 'bg-danger text-ink-invert hover:brightness-95 active:brightness-90',
        link: 'text-brand-600 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-9 px-3 text-base',
        md: 'h-11 px-4 text-base',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11 p-0',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean
  /** نص بديل يُعلن للقارئ الصوتي أثناء التحميل */
  loadingText?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading = false, loadingText, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(button({ variant, size, block }), className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {loading && loadingText ? loadingText : children}
    </button>
  )
})
