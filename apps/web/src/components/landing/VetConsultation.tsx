import { CheckCircle2, Headset, Stethoscope } from "lucide-react"

import { useInView } from "@/hooks"

const benefits = [
  "Xem thông tin thú cưng và triệu chứng trước khi khám",
  "Quản lý lịch hẹn và hàng đợi dễ dàng",
  "Gửi kết quả khám, đơn thuốc về app của chủ nuôi ngay",
]

export default function VetConsultation() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="veterinary" className="py-16">
      <div className="mx-auto grid w-[min(100%-24px,1200px)] gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className={`rounded-[32px] border border-po-border bg-white p-6 shadow-xl transition-all duration-500 ${inView ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-6 scale-95"}`}>
          <img
            src="/vet-clinic.png"
            alt="Bác sĩ thú y đang tư vấn cho chủ nuôi"
            className="aspect-4/3 w-full rounded-[24px] object-cover"
          />
          <div className="mt-5 grid gap-3">
            {[Headset, Stethoscope].map((Icon, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl border border-po-border bg-po-surface-muted px-4 py-3">
                <Icon className="size-5 text-po-primary" />
                <span className="text-sm font-semibold text-po-text">Nơi làm việc dành cho bác sĩ & lễ tân</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`grid gap-4 transition-all duration-500 delay-150 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Dành cho phòng khám</p>
          <h2 className="text-3xl font-extrabold text-po-text md:text-4xl">
            Bác sĩ và lễ tân quản lý bệnh nhân trong một chỗ.
          </h2>
          <p className="text-base leading-7 text-po-text-muted">
            Từ lúc tiếp nhận đến khi hoàn tất khám, mọi thông tin được cập nhật ngay cho chủ nuôi trên app.
          </p>
          <div className="mt-2 grid gap-3">
            {benefits.map((benefit, i) => (
              <div
                key={benefit}
                className={`flex items-center gap-2 rounded-2xl border border-po-border bg-white px-4 py-3 transition-all duration-400 hover:shadow-sm ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                style={{ transitionDelay: `${200 + i * 60}ms` }}
              >
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
