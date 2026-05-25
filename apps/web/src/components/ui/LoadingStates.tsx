import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-10 border-[3px]",
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-po-border border-t-po-primary",
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="Đang tải"
    />
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[24px] border border-po-border bg-po-surface-muted p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="size-9 rounded-2xl bg-po-border" />
        <div className="flex-1">
          <div className="mb-1 h-3 w-1/2 rounded bg-po-border" />
          <div className="h-2 w-1/3 rounded bg-po-border" />
        </div>
      </div>
      <div className="h-2 w-full rounded bg-po-border" />
      <div className="mt-2 h-2 w-2/3 rounded bg-po-border" />
    </div>
  )
}
