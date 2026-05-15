import { CheckCircle2, Headset, Stethoscope } from "lucide-react"

interface VetConsultationProps {
  title?: string
}

const benefits = [
  "Video consults with licensed vets",
  "AI-assisted symptom summaries",
  "After-care notes and prescriptions",
]

export default function VetConsultation({ title = "Veterinary consultation" }: VetConsultationProps) {
  return (
    <section id="veterinary" className="py-16">
      <div className="mx-auto grid w-[min(100%-24px,1200px)] gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="rounded-[32px] border border-po-border bg-white p-6 shadow-xl">
          <img
            src="/vet-clinic.png"
            alt="Warm veterinary consultation"
            className="aspect-4/3 w-full rounded-[24px] object-cover"
          />
          <div className="mt-5 grid gap-3">
            {[Headset, Stethoscope].map((Icon, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl border border-po-border bg-po-surface-muted px-4 py-3">
                <Icon className="size-5 text-po-primary" />
                <span className="text-sm font-semibold text-po-text">Same-day consults with care notes</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">{title}</p>
          <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">
            Seamless vet access without the stress.
          </h2>
          <p className="mt-4 text-base leading-7 text-po-text-muted">
            PetOmi keeps clinics and pet parents aligned with a shared consultation timeline, so every visit feels
            informed and gentle.
          </p>
          <div className="mt-6 grid gap-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 rounded-2xl border border-po-border bg-white px-4 py-3">
                <CheckCircle2 className="size-4 text-po-primary" />
                <span className="text-sm text-po-text-muted">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
