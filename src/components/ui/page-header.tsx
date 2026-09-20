export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </header>
  )
}
