'use client'

import { useEffect, useState } from 'react'

/**
 * علامة مائية باسم الطالب فوق الفيديو، لردع التسريب.
 *
 * ثلاثة قيود حكمت التنفيذ:
 *  1. **تتحرّك** كل بضع ثوانٍ بين تسعة مواضع، فلا يُقصّ المقطع لإخفائها
 *     ولا تُغطّى بعنصر ثابت.
 *  2. **لا تعترض التحكّم**: `pointer-events-none` حتى يبقى شريط المشغّل
 *     قابلًا للنقر تمامًا كما لو لم تكن موجودة.
 *  3. **خارج شجرة القراءة**: `aria-hidden` — اسم الطالب معروف له، وقراءته
 *     كل بضع ثوانٍ على القارئ الصوتي إزعاج بلا فائدة.
 *
 * وهي رادع لا حماية: من يصوّر الشاشة بكاميرا خارجية تظهر معه العلامة،
 * وهذا كل المقصود — أن يُعرف مصدر أي نسخة مسرَّبة.
 */

const POSITIONS = [
  'top-[8%] start-[6%]',
  'top-[8%] left-1/2 -translate-x-1/2',
  'top-[8%] end-[6%]',
  'top-1/2 start-[6%] -translate-y-1/2',
  'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'top-1/2 end-[6%] -translate-y-1/2',
  'bottom-[22%] start-[6%]',
  'bottom-[22%] left-1/2 -translate-x-1/2',
  'bottom-[22%] end-[6%]',
] as const

/** كل ٧ ثوانٍ: طويلة بما يكفي ألّا تُلهي، وقصيرة بما يكفي ألّا تُقصّ. */
const MOVE_EVERY_MS = 7000

export function VideoWatermark({ label }: { label: string }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * POSITIONS.length))

  useEffect(() => {
    if (!label) return
    const id = setInterval(() => {
      // موضع مختلف دائمًا عن السابق
      setI((prev) => {
        const next = Math.floor(Math.random() * (POSITIONS.length - 1))
        return next >= prev ? next + 1 : next
      })
    }, MOVE_EVERY_MS)
    return () => clearInterval(id)
  }, [label])

  if (!label) return null

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 select-none whitespace-nowrap rounded-[var(--radius-pill)] bg-brand-900/25 px-3 py-1 text-sm font-medium text-white/45 mix-blend-luminosity transition-all duration-700 ${POSITIONS[i]}`}
    >
      {label}
    </span>
  )
}
