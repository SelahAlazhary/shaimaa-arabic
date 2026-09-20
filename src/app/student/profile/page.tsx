import type { Metadata } from 'next'
import { User, Mail, Phone, GraduationCap, MapPin, School, BookMarked } from 'lucide-react'
import { requireStudent } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { LogoutButton } from '@/components/auth/logout-button'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'حسابي' }

const SECTION_LABELS = { scientific: 'علمي', literary: 'أدبي' } as const

export default async function StudentProfilePage() {
  const user = await requireStudent()
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select(
      'full_name, email, phone, school_name, section, created_at, grades(name_ar), education_stages(name_ar), governorates(name_ar)',
    )
    .eq('id', user.id)
    .single()

  const p = data as unknown as {
    full_name: string
    email: string
    phone: string | null
    school_name: string | null
    section: 'scientific' | 'literary' | null
    created_at: string
    grades: { name_ar: string } | null
    education_stages: { name_ar: string } | null
    governorates: { name_ar: string } | null
  } | null

  const rows = [
    { icon: User, label: 'الاسم', value: p?.full_name ?? user.fullName },
    { icon: Mail, label: 'البريد الإلكتروني', value: p?.email ?? user.email, ltr: true },
    { icon: Phone, label: 'رقم الموبايل', value: p?.phone ?? null, ltr: true },
    { icon: GraduationCap, label: 'المرحلة', value: p?.education_stages?.name_ar ?? null },
    { icon: BookMarked, label: 'الصف', value: p?.grades?.name_ar ?? null },
    {
      icon: BookMarked,
      label: 'الشعبة',
      value: p?.section ? SECTION_LABELS[p.section] : null,
    },
    { icon: MapPin, label: 'المحافظة', value: p?.governorates?.name_ar ?? null },
    { icon: School, label: 'المدرسة', value: p?.school_name ?? null },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="حسابي" description="بياناتك المسجّلة في المنصة." />

      <Card>
        <CardHeader
          title="البيانات الشخصية"
          icon={User}
          action={<Badge tone="success">حساب نشط</Badge>}
        />

        <dl className="divide-y divide-border-subtle">
          {rows.map(({ icon: Icon, label, value, ltr }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3.5">
              <Icon className="size-4 shrink-0 text-ink-faint" aria-hidden />
              <dt className="w-28 shrink-0 text-sm text-ink-muted">{label}</dt>
              <dd
                className={`min-w-0 flex-1 truncate text-sm ${value ? 'text-ink' : 'text-ink-faint'}`}
                dir={ltr && value ? 'ltr' : undefined}
                style={ltr && value ? { textAlign: 'start' } : undefined}
              >
                {value ?? 'غير مسجَّل'}
              </dd>
            </div>
          ))}
        </dl>

        {p?.created_at && (
          <p className="nums-ar border-t border-border-subtle px-5 py-3 text-xs text-ink-faint">
            عضو منذ {formatDate(p.created_at)}
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">تعديل البيانات</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          لتعديل الاسم أو الصف أو المدرسة، تواصل مع الدعم من صفحة المساعدة. بعض البيانات
          مرتبطة باشتراكاتك فلا تُعدَّل مباشرة.
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">الخروج من الحساب</h2>
        <div className="max-w-xs">
          <LogoutButton />
        </div>
      </Card>
    </div>
  )
}
