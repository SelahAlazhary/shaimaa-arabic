'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { logout } from '@/lib/mutations/auth'
import { Button } from '@/components/ui/button'

export function LogoutButton({ variant = 'secondary' }: { variant?: 'secondary' | 'ghost' }) {
  const [pending, start] = useTransition()

  return (
    <Button
      variant={variant}
      block
      loading={pending}
      loadingText="جارٍ الخروج…"
      onClick={() => start(() => void logout())}
    >
      <LogOut aria-hidden />
      تسجيل الخروج
    </Button>
  )
}
