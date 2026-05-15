import type { ElementType } from "react"

interface StatCardProps {
  label: string
  value: string
  icon: ElementType
  hint?: string
}

export default function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-po-text-muted">{label}</p>
        <span className="grid size-9 place-items-center rounded-2xl bg-white text-po-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-po-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-po-text-subtle">{hint}</p> : null}
    </div>
  )
}
