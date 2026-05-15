import { HeartHandshake, House, PawPrint } from "lucide-react"

interface AdoptionStory {
  name: string
  description: string
  icon: typeof PawPrint
}

const stories: AdoptionStory[] = [
  {
    name: "Coco",
    description: "Matched with a foster family in 48 hours with wellness coverage included.",
    icon: PawPrint,
  },
  {
    name: "Miso",
    description: "Found a home that loves trail walks and monthly vet check-ins.",
    icon: House,
  },
  {
    name: "Luna",
    description: "Adoption plan bundled with nutrition coaching and reminders.",
    icon: HeartHandshake,
  },
]

export default function AdoptionSection() {
  return (
    <section id="adoption" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)] rounded-[32px] border border-po-border bg-white px-6 py-10 shadow-sm">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Pet adoption</p>
            <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">
              Adoption journeys supported with real care.
            </h2>
            <p className="mt-4 text-base leading-7 text-po-text-muted">
              PetOmi connects shelters, new families, and care teams so every adoption comes with trusted guidance and
              a health-ready plan.
            </p>
          </div>
          <div className="grid gap-4">
            {stories.map((story) => {
              const Icon = story.icon
              return (
                <div key={story.name} className="flex items-start gap-3 rounded-2xl border border-po-border bg-po-surface-muted px-4 py-4">
                  <span className="grid size-10 place-items-center rounded-2xl bg-white text-po-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-po-text">{story.name}</p>
                    <p className="text-xs leading-5 text-po-text-muted">{story.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
