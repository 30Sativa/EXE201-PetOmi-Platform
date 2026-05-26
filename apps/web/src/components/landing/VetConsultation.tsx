import { CheckCircle2, Headset, Stethoscope } from "lucide-react"

import { useInView } from "@/hooks"

const benefits = [
  "Xem triệu chứng và hồ sơ thú cưng trước khi tiếp nhận",
  "Quản lý lịch hẹn, hàng đợi và check-in trong cùng một luồng",
  "Gửi kết quả khám, đơn thuốc về app của chủ nuôi ngay",
]

export default function VetConsultation() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="veterinary" className="py-20 md:py-28">
      <div className="mx-auto grid w-[calc(100%_-_24px)] max-w-[1200px] gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className={`relative transition-all duration-500 ${inView ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-6 scale-95"}`}>
          <img
            src="/vet-clinic.png"
            alt="Bác sĩ thú y đang kiểm tra một chú chó trong phòng khám"
            className="aspect-[4/3] w-full rounded-[30px] object-cover shadow-xl shadow-orange-200/25"
          />
          <div className="absolute -bottom-6 left-5 right-5 grid gap-3 rounded-[24px] border border-white/70 bg-white/[0.9] p-4 shadow-xl backdrop-blur sm:left-auto sm:w-[330px]">
            <div className="flex items-center gap-3">
              <Headset className="size-5 text-po-primary" />
              <span className="text-sm font-semibold text-po-text">Tiếp nhận có bối cảnh</span>
            </div>
            <div className="flex items-center gap-3 border-t border-po-border pt-3">
              <Stethoscope className="size-5 text-po-primary" />
              <span className="text-sm font-semibold text-po-text">Cập nhật kết quả về app</span>
            </div>
          </div>
        </div>
        <div className={`grid gap-5 transition-all duration-500 delay-150 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Dành cho phòng khám</p>
          <h2 className="max-w-xl text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
            Phòng khám vận hành nhẹ hơn, bác sĩ có thêm bối cảnh.
          </h2>
          <p className="text-base leading-7 text-po-text-muted">
            Từ lúc tiếp nhận đến khi hoàn tất khám, thông tin được cập nhật cho đúng người, đúng thời điểm, không cần hỏi lại nhiều lần.
          </p>
          <div className="mt-2 grid gap-4">
            {benefits.map((benefit, i) => (
              <div
                key={benefit}
                className={`flex items-start gap-3 border-t border-po-border pt-4 transition-all duration-400 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                style={{ transitionDelay: `${200 + i * 60}ms` }}
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-po-primary" />
                <span className="text-sm leading-6 text-po-text-muted">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
