import { Star } from "lucide-react"

interface Testimonial {
  name: string
  role: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    name: "Linh Tran",
    role: "Pet parent of two",
    quote: "PetOmi feels warm and premium at the same time. Booking and care notes are finally stress-free.",
  },
  {
    name: "Dr. Mai Nguyen",
    role: "Clinic director",
    quote: "Our intake quality improved instantly. PetOmi gives us context before every visit.",
  },
  {
    name: "Quang Vu",
    role: "First-time adopter",
    quote: "The adoption roadmap kept us calm and informed. We love the gentle reminders.",
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Testimonials</p>
            <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Trusted by pet families and clinics.</h2>
          </div>
          <div className="flex items-center gap-1 text-sm text-po-text-muted">
            {[0, 1, 2, 3, 4].map((index) => (
              <Star key={index} className="size-4 fill-orange-300 text-orange-300" />
            ))}
            <span>4.9 average rating</span>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="rounded-[28px] border border-po-border bg-white p-5 shadow-sm">
              <p className="text-sm leading-6 text-po-text-muted">“{testimonial.quote}”</p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-po-text">{testimonial.name}</p>
                <p className="text-xs text-po-text-muted">{testimonial.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
