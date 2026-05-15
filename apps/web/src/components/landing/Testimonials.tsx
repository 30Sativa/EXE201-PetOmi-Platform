import { Star } from "lucide-react"

interface Testimonial {
  name: string
  role: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    name: "Linh Tran",
    role: "Pet owner",
    quote: "AI pre-check giúp mình biết mức độ khẩn, đặt lịch nhanh và theo dõi lịch sử tiêm phòng dễ dàng.",
  },
  {
    name: "Dr. Mai Nguyen",
    role: "Clinic director",
    quote: "Pre-visit summary giúp bác sĩ khám nhanh hơn, lịch hẹn và queue rõ ràng cho lễ tân.",
  },
  {
    name: "Quang Vu",
    role: "Admin operations",
    quote: "Luồng duyệt clinic và audit log giúp team quản trị vận hành minh bạch hơn hẳn.",
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Feedback</p>
            <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Được tin dùng bởi Owner, Vet và Admin.</h2>
          </div>
          <div className="flex items-center gap-1 text-sm text-po-text-muted">
            {[0, 1, 2, 3, 4].map((index) => (
              <Star key={index} className="size-4 fill-orange-300 text-orange-300" />
            ))}
            <span>4.9 điểm trung bình</span>
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
