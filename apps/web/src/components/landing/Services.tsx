import { HeartPulse, PawPrint, ShieldPlus, Sparkles } from "lucide-react"

interface ServiceItem {
  title: string
  description: string
  icon: typeof PawPrint
  tag: string
}

const services: ServiceItem[] = [
  {
    title: "AI symptom check",
    description: "Warm, evidence-based triage and next-step guidance any time of day.",
    icon: Sparkles,
    tag: "Instant answers",
  },
  {
    title: "Smart pet profiles",
    description: "Centralize vaccines, visits, and prescriptions in a single timeline.",
    icon: PawPrint,
    tag: "Lifetime record",
  },
  {
    title: "Verified clinics",
    description: "Book with clinics vetted for care quality, transparency, and empathy.",
    icon: ShieldPlus,
    tag: "Trusted partners",
  },
  {
    title: "Wellness plans",
    description: "Personalized care plans with gentle reminders and easy rescheduling.",
    icon: HeartPulse,
    tag: "Always on track",
  },
]

export default function Services() {
  return (
    <section id="services" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Services</p>
            <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">
              Everything your pet needs, beautifully organized.
            </h2>
          </div>
          <p className="max-w-md text-sm text-po-text-muted">
            Built for modern pet families who want gentle guidance, seamless bookings, and premium clinic experiences.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <article
                key={service.title}
                className="group rounded-[28px] border border-po-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-po-text">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-po-text-muted">{service.description}</p>
                <span className="mt-5 inline-flex rounded-full bg-po-surface-muted px-3 py-1 text-xs font-semibold text-po-text-subtle">
                  {service.tag}
                </span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
