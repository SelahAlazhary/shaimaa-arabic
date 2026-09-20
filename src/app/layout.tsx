import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'منصة الأستاذة الشيماء أحمد',
    template: '%s · منصة الأستاذة الشيماء أحمد',
  },
  description:
    'منصة تعليمية لمتابعة الدروس والاختبارات والحصص المباشرة، مع تتبّع تقدّمك أولًا بأول.',
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#23382D',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster
          position="top-center"
          dir="rtl"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
        />
      </body>
    </html>
  )
}
