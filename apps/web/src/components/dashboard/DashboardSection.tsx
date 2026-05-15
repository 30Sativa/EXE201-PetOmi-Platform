import type { ReactNode } from "react"

interface DashboardSectionProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export default function DashboardSection({ title, subtitle, action, children }: DashboardSectionProps) {
  return (
    <section className="rounded-[28px] border border-po-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-po-text md:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-po-text-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
