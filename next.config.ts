import type { NextConfig } from 'next'

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
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
