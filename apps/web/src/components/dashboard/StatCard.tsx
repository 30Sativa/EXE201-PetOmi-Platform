import { cn } from "@/lib/utils"
import type { ElementType } from "react"

interface StatCardProps {
  label: string
  value: string
  icon: ElementType
  hint?: string
  className?: string
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[26px] bg-white/85 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-[11rem] text-sm font-semibold leading-5 text-po-text-muted">{label}</p>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold leading-none text-po-text tabular-nums">{value}</p>
      {hint ? <p className="mt-2 text-xs font-medium leading-5 text-po-text-subtle">{hint}</p> : null}
    </div>
  )
}
