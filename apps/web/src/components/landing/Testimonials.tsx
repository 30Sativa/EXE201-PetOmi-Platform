import { Star } from "lucide-react"

import { useInView } from "@/hooks"
import type { Testimonial } from "@/types"

const testimonials: Testimonial[] = [
  {
    name: "Ngọc Linh",
    role: "Chủ nuôi",
    quote: "Mỗi lần bé mèo có vấn đề là mình hỏi AI trước, biết ngay có cần đi khám gấp không. Tiết kiệm được nhiều lần chạy đi khám không cần thiết.",
  },
  {
    name: "Dr. Hải Minh",
    role: "Bác sĩ thú y",
    quote: "Trước khi bệnh nhân đến, tôi đã biết triệu chứng và tiền sử. Nhờ vậy khám nhanh hơn và chính xác hơn rất nhiều.",
  },
  {
    name: "Anh Khoa",
    role: "Quản lý phòng khám",
    quote: "Hàng đợi rõ ràng, lịch hẹn không chồng chéo, và chủ nuôi luôn được cập nhật. Vận hành phòng khám nhẹ nhàng hơn hẳn.",
  },
]

export default function Testimonials() {
  const { ref, inView } = useInView({ threshold: 0.1 })
  const featured = testimonials[0]
  const supporting = testimonials.slice(1)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="testimonials" className="py-20 md:py-24">
      <div className="mx-auto w-[calc(100%_-_24px)] max-w-[1200px]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className={`transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Cảm nhận thực tế</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
              Bình tĩnh hơn trong những ngày thú cưng có vấn đề.
            </h2>
          </div>
          <div className={`flex items-center gap-1 text-sm text-po-text-muted transition-all duration-500 delay-100 md:justify-end ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Star key={index} className="size-4 fill-orange-300 text-orange-300" />
            ))}
            <span>4.9 điểm trung bình</span>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article
            className={`rounded-[30px] bg-white p-7 shadow-sm transition-all duration-500 md:p-9 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <p className="max-w-3xl text-2xl font-semibold leading-snug text-po-text md:text-3xl">
              “{featured.quote}”
            </p>
            <div className="mt-8 flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-po-primary-soft text-sm font-extrabold text-po-primary">
                NL
              </span>
              <div>
                <p className="text-sm font-semibold text-po-text">{featured.name}</p>
                <p className="text-xs text-po-text-muted">{featured.role}</p>
              </div>
            </div>
          </article>

          <div className="grid gap-5">
            {supporting.map((testimonial, i) => (
              <article
                key={testimonial.name}
                className={`rounded-[24px] border border-po-border bg-po-surface-muted/75 p-5 transition-all duration-500 hover:bg-white hover:shadow-md ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${(i + 1) * 100}ms` }}
              >
                <p className="text-sm leading-6 text-po-text-muted">“{testimonial.quote}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-xs font-extrabold text-po-primary">
                    {testimonial.name.includes("Hải") ? "HM" : "AK"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-po-text">{testimonial.name}</p>
                    <p className="text-xs text-po-text-muted">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
