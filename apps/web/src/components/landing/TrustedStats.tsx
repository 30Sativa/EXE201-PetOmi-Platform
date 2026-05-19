import { AlertTriangle, Layers, ShieldCheck, Users } from "lucide-react"

import { useInView } from "@/hooks"

interface StatItemFull {
  label: string
  value: string
  icon: typeof Users
}

const stats: StatItemFull[] = [
  { label: "Phòng khám được duyệt", value: "100+", icon: Users },
  { label: "Chủ nuôi tin dùng", value: "50K+", icon: ShieldCheck },
  { label: "Lịch hẹn hàng ngày", value: "500+", icon: Layers },
  { label: "Cảnh báo khẩn", value: "24/7", icon: AlertTriangle },
]

export default function TrustedStats() {
  const { ref, inView } = useInView({ threshold: 0.2 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-12">
      <div className={`mx-auto grid w-[min(100%-24px,1100px)] gap-6 rounded-[32px] border border-po-border bg-white/80 p-6 shadow-sm md:grid-cols-4 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl bg-po-surface-muted/60 p-4 transition-all duration-500"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-extrabold text-po-text">{stat.value}</p>
                <p className="text-sm text-po-text-muted">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
