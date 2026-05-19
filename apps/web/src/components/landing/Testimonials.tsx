import { Star } from "lucide-react"

import { useInView } from "../../lib/useInView"

interface Testimonial {
  name: string
  role: string
  quote: string
}

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

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="testimonials" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className={`transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Cảm nhận thực tế</p>
            <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Những người đã dùng PetOmi nói gì.</h2>
          </div>
          <div className={`flex items-center gap-1 text-sm text-po-text-muted transition-all duration-500 delay-100 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Star key={index} className="size-4 fill-orange-300 text-orange-300" />
            ))}
            <span>4.9 điểm trung bình</span>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <article
              key={testimonial.name}
              className={`rounded-[28px] border border-po-border bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <p className="text-sm leading-6 text-po-text-muted">"{testimonial.quote}"</p>
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
