import { Award, ShieldCheck, Users } from "lucide-react"

interface StatItem {
  label: string
  value: string
  icon: typeof Users
}

const stats: StatItem[] = [
  { label: "Happy pet owners", value: "24k+", icon: Users },
  { label: "Vet partners", value: "320", icon: ShieldCheck },
  { label: "Care plans delivered", value: "18k", icon: Award },
]

export default function TrustedStats() {
  return (
    <section className="py-12">
      <div className="mx-auto grid w-[min(100%-24px,1100px)] gap-6 rounded-[32px] border border-po-border bg-white/80 p-6 shadow-sm md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl bg-po-surface-muted/60 p-4">
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
