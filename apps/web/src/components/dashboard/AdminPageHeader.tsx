import type { ElementType } from "react"

import { cn } from "@/lib/utils"

type HeaderMetric = {
  label: string
  value: string
  icon: ElementType
  tone?: "primary" | "success" | "warning" | "danger" | "muted"
}

interface AdminPageHeaderProps {
  kicker: string
  title: string
  description: string
  icon: ElementType
  metrics?: HeaderMetric[]
}

const toneClasses: Record<NonNullable<HeaderMetric["tone"]>, string> = {
  primary: "text-po-primary",
  success: "text-po-success",
  warning: "text-po-warning",
  danger: "text-po-danger",
  muted: "text-po-text-muted",
}

export default function AdminPageHeader({
  kicker,
  title,
  description,
  icon: Icon,
  metrics = [],
}: AdminPageHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[30px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
      <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-[20px] bg-po-primary-soft text-po-primary ring-1 ring-po-border/80">
            <Icon className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              {kicker}
            </p>
            <h2 className="mt-1 truncate text-2xl font-extrabold leading-tight text-po-text">
              {title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-po-text-muted">
              {description}
            </p>
          </div>
        </div>

        {metrics.length > 0 ? (
          <div className={cn("grid gap-2 sm:grid-cols-3", metrics.length >= 4 ? "xl:min-w-[640px] xl:grid-cols-4" : "xl:min-w-[520px]")}>
            {metrics.map((metric) => {
              const MetricIcon = metric.icon
              const tone = metric.tone ?? "primary"

              return (
                <div
                  key={metric.label}
                  className="rounded-2xl bg-po-surface-muted/75 px-3 py-2.5 ring-1 ring-po-border/70"
                >
                  <div className="flex items-center gap-2">
                    <MetricIcon className={cn("size-3.5", toneClasses[tone])} />
                    <p className="text-lg font-extrabold tabular-nums text-po-text">
                      {metric.value}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold leading-4 text-po-text-muted">
                    {metric.label}
                  </p>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}
