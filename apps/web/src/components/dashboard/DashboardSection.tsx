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
        "rounded-[28px] border border-po-border bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-po-text md:text-xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-po-text-muted">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  )
}
