import type { DashboardSectionProps } from "@/types"
import { cn } from "@/lib/utils"

export default function DashboardSection({
  title,
  subtitle,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] bg-white/90 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80",
        className,
      )}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight text-po-text">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-po-text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  )
}
