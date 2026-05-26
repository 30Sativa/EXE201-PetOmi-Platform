import { AlertTriangle, Layers, ShieldCheck, Users } from "lucide-react"

import { useInView } from "@/hooks"

interface StatItemFull {
  label: string
  value: string
  icon: typeof Users
}

const stats: StatItemFull[] = [
  { label: "phòng khám được duyệt", value: "100+", icon: Users },
  { label: "chủ nuôi tin dùng", value: "50K+", icon: ShieldCheck },
  { label: "lịch hẹn mỗi ngày", value: "500+", icon: Layers },
  { label: "cảnh báo khẩn", value: "24/7", icon: AlertTriangle },
]

export default function TrustedStats() {
  const { ref, inView } = useInView({ threshold: 0.2 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="bg-white/55 py-14">
      <div className={`mx-auto grid w-[calc(100%_-_24px)] max-w-[1200px] gap-8 transition-all duration-500 md:grid-cols-[0.9fr_1.4fr] md:items-center ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Niềm tin vận hành</p>
          <h2 className="mt-3 max-w-md text-3xl font-extrabold leading-tight text-po-text md:text-4xl">
            Một nền tảng cho cả chủ nuôi và phòng khám.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="border-l border-po-border pl-4 transition-all duration-500"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <Icon className="size-5 text-po-primary" />
                <p className="mt-3 text-3xl font-extrabold leading-none text-po-text">{stat.value}</p>
                <p className="mt-2 text-sm leading-5 text-po-text-muted">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
