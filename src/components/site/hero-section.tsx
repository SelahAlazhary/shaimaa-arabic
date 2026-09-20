import Image from 'next/image'
import { HERO } from '@/lib/site/content'
import { HeroButtons } from '@/components/site/cta-buttons'

/**
 * زخرفة هندسية إسلامية: دوائر متشابكة، أساس النقش العربي.
 * رمادية فاتحة جدًا فلا تنافس المحتوى، ومحصورة في الجهة اليسرى خلف الصورة.
 */
function GeometricOrnament() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-y-0 end-0 hidden w-[55%] text-ornament opacity-60 lg:block"
      style={{ maskImage: 'linear-gradient(to left, black 40%, transparent 92%)' }}
    >
      <defs>
        <pattern id="hero-arabesque" width="64" height="64" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="32" r="22.6" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="64" cy="32" r="22.6" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="32" cy="0" r="22.6" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="32" cy="64" r="22.6" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-arabesque)" />
    </svg>
  )
}

/**
 * زخرفة خطّية: حروف عربية ضخمة عند الحافة اليمنى.
 * الموضوع نفسه — اللغة العربية — يصير خلفية بصرية.
 */
function CalligraphyOrnament() {
  return (
    <p
      aria-hidden
      className="pointer-events-none absolute -start-6 top-1/2 hidden -translate-y-1/2 select-none flex-col text-[9rem] font-bold leading-[0.78] text-ornament lg:flex"
    >
      <span>ض</span>
      <span>ق</span>
      <span>ع</span>
      <span>ب</span>
    </p>
  )
}

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden bg-canvas">
      <GeometricOrnament />
      <CalligraphyOrnament />

      {/*
       * لوحة الصورة تملأ الحافة اليسرى. حدّها الأيمن قوس واحد:
       * نصف قطر الزاوية العليا اليمنى ١٠٠٪ أفقيًا ورأسيًا يرسم ربع دائرة
       * تبدأ من أعلى اللوحة وتنتهي عند أسفل حافّتها — ضيّقة أعلى، واسعة أسفل.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 end-0 hidden w-[38%] max-w-[37rem] lg:block"
      >
        <div className="absolute inset-0 overflow-hidden [border-radius:0_100%_0_0/0_100%_0_0] bg-surface">
          <Image
            src="/brand/teacher.webp"
            alt={HERO.imageAlt}
            fill
            priority
            quality={92}
            sizes="(min-width: 1560px) 37rem, (min-width: 1024px) 38vw, 0px"
            className="object-contain object-[68%_bottom]"
          />
        </div>

        {/* القوس الذهبي: رفيع، يتتبّع الحدّ نفسه مُزاحًا للخارج قليلًا */}
        <span className="absolute -bottom-px -end-8 -top-8 start-0 border-e border-t border-accent [border-radius:0_100%_0_0/0_100%_0_0]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:min-h-[34rem] lg:py-28">
        {/* الترتيب على الموبايل: النص أولًا ثم الصورة (طلب صريح) */}
        <div className="lg:w-[54%]">
          <p className="flex items-center gap-3 text-sm font-medium tracking-wide text-accent-ink">
            {HERO.eyebrow}
            <span className="flex items-center gap-1.5" aria-hidden>
              <span className="h-px w-16 bg-accent/70" />
              <span className="size-1.5 rotate-45 bg-accent" />
              <span className="h-px w-6 bg-accent/70" />
            </span>
          </p>

          <h1 className="mt-6 text-[1.875rem] font-bold leading-[1.28] text-brand-800 sm:text-[2.375rem] lg:text-[3rem]">
            {HERO.titleLine1}
            <br className="hidden sm:block" />{' '}
            {HERO.titleLine2}
          </h1>

          <p className="mt-6 max-w-[34rem] text-base leading-[1.9] text-ink-muted">
            {HERO.description}
          </p>

          <div className="mt-9">
            <HeroButtons />
          </div>
        </div>

        {/* الصورة على الشاشات الصغيرة: القوس الممتدّ لا معنى له في عمود واحد */}
        <div className="relative mx-auto mt-10 aspect-square w-60 sm:w-72 lg:hidden">
          <span
            aria-hidden
            className="absolute -inset-x-[8%] -bottom-[6%] top-[4%] rounded-[50%] border border-accent bg-surface"
          />
          <Image
            src="/brand/teacher.webp"
            alt={HERO.imageAlt}
            fill
            quality={90}
            sizes="(min-width: 640px) 18rem, 15rem"
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </section>
  )
}
