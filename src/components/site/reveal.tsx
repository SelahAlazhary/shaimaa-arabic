'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * إظهار عند دخول العنصر إطار الشاشة، وإخفاء عند خروجه فيتكرّر مع التمرير.
 *
 * الحركة تُترك للـCSS: هذا المكوّن لا يفعل غير وضع `data-visible`.
 * وهو يُعيد الحالة عند الخروج عمدًا — الظهور لمرة واحدة يجعل العودة
 * إلى أعلى الصفحة تجد الإطار ساكنًا بلا حياة.
 *
 * ومن طلب تقليل الحركة يرى العنصر ظاهرًا فورًا بلا مراقبة أصلًا.
 */
export function Reveal({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    let answered = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        answered = true
        setVisible(Boolean(entry?.isIntersecting))
      },
      // ربع العنصر يكفي ليبدأ، وهامش سفلي يمنع الوميض عند حافة الشاشة
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(el)

    /*
     * صمام أمان: المراقب يُطلق استدعاءه الأول فور الربط عادةً، لكنه قد
     * يصمت في بيئات لا تَرسم الصفحة. والعنصر المخفيّ الذي ينتظر إشارة
     * لا تأتي يبقى مخفيًّا للأبد — فنُظهره بعد ثانية إن لم يردّ.
     */
    const failsafe = window.setTimeout(() => {
      if (!answered) setVisible(true)
    }, 1000)

    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [])

  return (
    <div ref={ref} data-visible={visible} className={className}>
      {children}
    </div>
  )
}
