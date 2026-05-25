import { cn } from "@/lib/utils"
import type { ComponentType } from "react"

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-po-surface-muted">
          <Icon className="size-7 text-po-text-subtle" />
        </div>
      )}
      <p className="text-sm font-semibold text-po-text">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-po-text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
