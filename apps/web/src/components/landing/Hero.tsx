import { ArrowUpRight, CalendarCheck, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Highlight {
  title: string
  description: string
  icon: typeof Sparkles
}

const highlights: Highlight[] = [
  {
    title: "AI pet care concierge",
    description: "Gentle triage, next-step guidance, and peace of mind in minutes.",
    icon: Sparkles,
  },
  {
    title: "One tap booking",
    description: "Match with verified clinics and pick a time that fits your routine.",
    icon: CalendarCheck,
  },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,247,237,0.96),_rgba(255,255,255,0.9),_rgba(236,253,245,0.85))]">
      <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full bg-[radial-gradient(circle,_rgba(253,186,116,0.35),_rgba(253,186,116,0))]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-80 translate-x-16 translate-y-12 rounded-full bg-[radial-gradient(circle,_rgba(110,231,183,0.35),_rgba(110,231,183,0))]" />

      <div className="mx-auto grid w-[min(100%-24px,1200px)] gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div className="flex flex-col justify-center">
          <span className="w-fit rounded-full border border-po-border bg-white px-3 py-1 text-xs font-semibold uppercase text-po-text-muted">
            Modern pet-care SaaS
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
            Premium care journeys for pets, designed for busy owners.
          </h1>
          <p className="mt-4 text-base leading-7 text-po-text-muted md:text-lg">
            PetOmi blends warm AI guidance, trusted clinics, and beautifully organized pet records so you can focus on
            cuddles instead of paperwork.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="h-12 rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 hover:bg-po-primary-hover">
              Get started free
              <ArrowUpRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full border-po-border bg-white px-6 text-sm font-semibold text-po-text"
            >
              View live demo
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-3xl border border-po-border bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-po-text">{item.title}</p>
                      <p className="text-xs leading-5 text-po-text-muted">{item.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-6 hidden rounded-3xl border border-po-border bg-white px-4 py-3 text-xs font-semibold text-po-text shadow-lg md:block">
            4.9 rated in pet care
          </div>
          <div className="rounded-[32px] border border-po-border bg-white/90 p-4 shadow-xl">
            <div className="rounded-[24px] bg-gradient-to-br from-orange-100 via-amber-50 to-emerald-50 p-6">
              <div className="rounded-[20px] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-po-text">Bella, 2 yrs</p>
                    <p className="text-xs text-po-text-muted">Golden Retriever</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Calm check
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-po-border bg-po-surface-muted px-3 py-2 text-xs text-po-text-muted">
                    AI note: hydration + gentle walk recommended.
                  </div>
                  <div className="rounded-2xl border border-po-border bg-white px-3 py-2 text-xs text-po-text-muted">
                    Next visit: Friday, 9:30 AM
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-white/70 bg-white/70 p-4 text-xs text-po-text-muted">
                Your pet timeline is synced with trusted vets and reminders.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
