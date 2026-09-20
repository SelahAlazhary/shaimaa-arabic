import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { HERO } from '@/lib/site/content'

function Arabesque({ className = '', opacity = 0.05 }: { className?: string; opacity?: number }) {
  return (
    <svg aria-hidden className={`absolute inset-0 size-full ${className}`} style={{ opacity }}>
      <defs>
        <pattern id={`ara-${opacity}`} width="72" height="72" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="36" r="25.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="72" cy="36" r="25.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="36" cy="0" r="25.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="36" cy="72" r="25.4" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#ara-${opacity})`} />
    </svg>
  )
}

function GoldRule({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${className}`} aria-hidden>
      <span className="h-px w-14 bg-accent/70" />
      <span className="size-1.5 rotate-45 bg-accent" />
      <span className="h-px w-5 bg-accent/70" />
    </span>
  )
}

function PrimaryButton() {
  return (
    <Link
      href="/register"
      className="inline-flex h-14 items-center gap-2.5 rounded-[var(--radius-field)] bg-accent px-8 text-[0.9375rem] font-semibold text-brand-900 transition-colors hover:bg-accent-soft"
    >
      {HERO.primaryCta}
      <ArrowLeft className="size-4" aria-hidden />
    </Link>
  )
}

function SecondaryButton() {
  return (
    <a
      href="#courses"
      className="inline-flex h-14 items-center gap-2.5 rounded-[var(--radius-field)] border border-brand-400 px-8 text-[0.9375rem] font-medium text-ink-invert transition-colors hover:bg-brand-700"
    >
      {HERO.secondaryCta}
      <BookOpen className="size-4" aria-hidden />
    </a>
  )
}

/**
 * الواجهة الأولى.
 * لوحة خضراء داكنة تمتدّ من الشريط العلوي ككتلة واحدة: الصورة المقصوصة
 * على أرضية داكنة تظهر بلا صندوق أبيض حولها، وهو ما كان يُفسد التخطيط الفاتح.
 */
export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden bg-brand-800">
      <Arabesque className="text-accent" opacity={0.07} />

      {/* خطّ ذهبي رفيع يفصل الواجهة عمّا تحتها */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-accent/40" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_26rem] lg:gap-14 lg:py-20">
        <div>
          <p className="flex items-center gap-3 text-[0.9375rem] font-semibold tracking-wide text-accent-soft">
            {HERO.eyebrow}
            <GoldRule />
          </p>

          <h1 className="mt-6 text-[2rem] font-bold leading-[1.3] text-ink-invert sm:text-[2.5rem] lg:text-[3.25rem]">
            {HERO.titleLine1}
            <br className="hidden sm:block" /> {HERO.titleLine2}
          </h1>

          <p className="mt-6 max-w-[36rem] text-[1.125rem] leading-[1.95] text-brand-100">
            {HERO.description}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <PrimaryButton />
            <SecondaryButton />
          </div>
        </div>

        {/*
         * الصورة المقصوصة على أرضية داكنة: لا صندوق أبيض حولها،
         * وحوافّها تذوب في الخلفية بدل أن تُقطع.
         */}
        <div className="relative mx-auto aspect-[4/5] w-64 sm:w-72 lg:w-full">
          <span
            aria-hidden
            className="absolute -inset-x-6 bottom-0 top-8 rounded-t-[50%] border border-accent/50 bg-brand-900/40"
          />
          <Image
            src="/brand/teacher.webp"
            alt={HERO.imageAlt}
            fill
            priority
            quality={92}
            sizes="(min-width: 1024px) 26rem, 18rem"
            className="object-contain object-bottom"
            style={{
              maskImage: 'linear-gradient(to top, transparent 0%, black 10%)',
              WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 10%)',
            }}
          />
        </div>
      </div>
    </section>
  )
}
