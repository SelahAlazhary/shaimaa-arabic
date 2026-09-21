'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Eye, EyeOff, Check, X } from 'lucide-react'
import {
  addStage,
  addGrade,
  renameGrade,
  toggleGradeVisible,
  toggleStageVisible,
} from '@/lib/mutations/reference'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils/format'

export type GradeRow = { id: string; name: string; visible: boolean; students: number }
export type StageRow = { id: string; name: string; visible: boolean; grades: GradeRow[] }

export function GradesManager({ stages }: { stages: StageRow[] }) {
  const [pending, start] = useTransition()
  const [newStage, setNewStage] = useState('')
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newGrade, setNewGrade] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const run = (fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn()
      if (res.ok) {
        toast.success(res.message)
        after?.()
      } else {
        toast.error(res.message)
      }
    })

  return (
    <div className="divide-y divide-border-subtle">
      {stages.map((stage) => (
        <section key={stage.id} className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2.5 text-lg font-semibold text-ink">
              {stage.name}
              {!stage.visible && <Badge tone="warning">مخفية</Badge>}
              <span className="nums-ar text-sm font-normal text-ink-faint">
                {formatNumber(stage.grades.length)} صف
              </span>
            </h3>

            <span className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => run(() => toggleStageVisible(stage.id, !stage.visible))}
              >
                {stage.visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                {stage.visible ? 'أخفِ المرحلة' : 'أظهر المرحلة'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setAddingTo(addingTo === stage.id ? null : stage.id)
                  setNewGrade('')
                }}
              >
                <Plus aria-hidden />
                صف جديد
              </Button>
            </span>
          </div>

          {addingTo === stage.id && (
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newGrade.trim()) {
                    run(() => addGrade(stage.id, newGrade), () => {
                      setNewGrade('')
                      setAddingTo(null)
                    })
                  }
                  if (e.key === 'Escape') setAddingTo(null)
                }}
                autoFocus
                aria-label={`اسم الصف الجديد في ${stage.name}`}
                className="h-12 min-w-0 flex-1 rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 text-base text-ink"
              />
              <Button
                disabled={pending || !newGrade.trim()}
                onClick={() =>
                  run(() => addGrade(stage.id, newGrade), () => {
                    setNewGrade('')
                    setAddingTo(null)
                  })
                }
              >
                أضف
              </Button>
            </div>
          )}

          <ul className="divide-y divide-border-subtle rounded-[var(--radius-card)] border border-border-subtle">
            {stage.grades.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                {editing === g.id ? (
                  <>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          run(() => renameGrade(g.id, draft), () => setEditing(null))
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      autoFocus
                      aria-label={`اسم ${g.name}`}
                      className="h-11 min-w-0 flex-1 rounded-[var(--radius-field)] border border-border-strong bg-surface px-3 text-base text-ink"
                    />
                    <span className="flex gap-1">
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => renameGrade(g.id, draft), () => setEditing(null))}
                        aria-label="حفظ الاسم"
                      >
                        <Check aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(null)}
                        aria-label="إلغاء"
                      >
                        <X aria-hidden />
                      </Button>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="min-w-0">
                      <span className="block text-base font-medium text-ink">{g.name}</span>
                      <span className="nums-ar text-sm text-ink-faint">
                        {formatNumber(g.students)} طالب
                      </span>
                    </span>

                    <span className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge tone={g.visible ? 'success' : 'neutral'}>
                        {g.visible ? 'ظاهر' : 'مخفي'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => toggleGradeVisible(g.id, !g.visible))}
                        aria-label={g.visible ? `أخفِ ${g.name}` : `أظهر ${g.name}`}
                      >
                        {g.visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDraft(g.name)
                          setEditing(g.id)
                        }}
                        aria-label={`تعديل اسم ${g.name}`}
                      >
                        <Pencil aria-hidden />
                      </Button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* مرحلة جديدة — نادرة، فتأتي في الذيل لا في الرأس */}
      <div className="flex flex-wrap gap-2 p-5">
        <input
          value={newStage}
          onChange={(e) => setNewStage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newStage.trim())
              run(() => addStage(newStage), () => setNewStage(''))
          }}
          placeholder="اسم مرحلة جديدة"
          aria-label="اسم مرحلة جديدة"
          className="h-12 min-w-0 flex-1 rounded-[var(--radius-field)] border border-border-strong bg-surface px-3.5 text-base text-ink"
        />
        <Button
          variant="secondary"
          disabled={pending || !newStage.trim()}
          onClick={() => run(() => addStage(newStage), () => setNewStage(''))}
        >
          <Plus aria-hidden />
          أضف مرحلة
        </Button>
      </div>
    </div>
  )
}
