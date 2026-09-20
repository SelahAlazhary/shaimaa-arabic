import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * عميل الخادم لمكوّنات الخادم وServer Actions.
 * لا يُخزَّن في متغيّر عام: الجلسة مرتبطة بالطلب.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // مكوّن خادم لا يملك الكتابة؛ middleware هو من يجدّد الجلسة
          }
        },
      },
    },
  )
}
