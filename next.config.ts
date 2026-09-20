import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Next 16 يرفض أي قيمة quality غير مُعلَنة هنا
    qualities: [75, 90, 95],
    remotePatterns: [
      // صور الكورسات والأفاتار تُخدَّم من تخزين Supabase فقط
      { protocol: 'https', hostname: 'bjhegvkxxtmajyzfampa.supabase.co', pathname: '/storage/v1/object/**' },
    ],
  },
  async headers() {
    const supabase = 'https://bjhegvkxxtmajyzfampa.supabase.co'
    const wsSupabase = 'wss://bjhegvkxxtmajyzfampa.supabase.co'

    /*
     * سياسة أمان المحتوى.
     * 'unsafe-inline' في script-src ضرورة لا خيار: Next يحقن سكربت الترطيب
     * مضمَّنًا. و'unsafe-eval' في التطوير وحده (Turbopack يحتاجه).
     * media-src يسمح بأي https لأن روابط الفيديو تُدخلها الأستاذة بنفسها.
     */
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src 'self' data: blob: ${supabase}`,
      "media-src 'self' blob: https:",
      'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
      `connect-src 'self' ${supabase} ${wsSupabase}${isDev ? ' ws://localhost:*' : ''}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS في الإنتاج وحده: فرضه على localhost يمنع التطوير بـhttp
          ...(isDev
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]),
        ],
      },
    ]
  },
}

export default nextConfig
