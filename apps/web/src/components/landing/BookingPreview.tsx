import { CalendarDays, Clock, MapPin, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useInView } from "@/hooks"
import type { Slot } from "@/types"

const slots: Slot[] = [
  { time: "09:30", label: "Sáng" },
  { time: "11:00", label: "Cuối sáng" },
  { time: "16:45", label: "Chiều" },
]

export default function BookingPreview() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="booking" className="bg-white/65 py-20 md:py-24">
      <div className="mx-auto grid w-[calc(100%_-_24px)] max-w-[1200px] gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <div className={`grid gap-4 transition-all duration-500 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Đặt lịch khám</p>
          <h2 className="max-w-xl text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
            Đến đúng phòng khám, đúng thông tin, đúng lúc.
          </h2>
          <p className="text-base leading-7 text-po-text-muted">
            PetOmi gợi ý phòng khám và giờ khám phù hợp. Chủ nuôi thấy rõ lịch, phòng khám nhận trước triệu chứng và hồ sơ cần thiết.
          </p>
          <div className="mt-2 grid gap-4">
            {[
              { icon: MapPin, title: "Gợi ý theo vị trí", text: "Chọn phòng khám gần bạn và phù hợp tình trạng hiện tại." },
              { icon: ShieldCheck, title: "Review và trạng thái rõ ràng", text: "Xem phòng khám đã được duyệt, đánh giá và lịch còn trống." },
              { icon: CalendarDays, title: "Nhắc lịch sau khi đặt", text: "Không quên giờ khám, lịch tiêm hay thuốc cần uống." },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className={`flex gap-4 border-t border-po-border pt-4 transition-all duration-400 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-po-primary" />
                  <div>
                    <p className="text-sm font-semibold text-po-text">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-po-text-muted">{item.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`relative min-h-[560px] overflow-hidden rounded-[30px] bg-po-text shadow-xl shadow-orange-200/30 transition-all duration-500 delay-150 ${inView ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-6 scale-95"}`}>
          <img
            src="/clinic-showcase.png"
            alt="Mặt tiền và phòng khám thú y có bác sĩ đang tiếp nhận thú cưng"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(74,47,33,0.18),_rgba(74,47,33,0.68))]" />
          <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/70 bg-white/[0.9] p-5 shadow-2xl backdrop-blur md:left-auto md:w-[360px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-po-text-subtle">Lịch hẹn gần nhất</p>
                <h3 className="mt-2 text-xl font-semibold leading-snug text-po-text">PetOmi Clinic District 2</h3>
                <p className="text-sm text-po-text-muted">Cách bạn 2.1 km</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-po-primary-soft px-3 py-1 text-xs font-semibold text-po-text">
                <Clock className="size-3.5 text-po-primary" />
                3 slot
              </span>
            </div>
            <div className="mt-5 space-y-2">
              {slots.map((slot) => (
                <div key={slot.time} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3 text-sm">
                  <span className="font-semibold text-po-text">{slot.time}</span>
                  <span className="text-xs text-po-text-muted">{slot.label}</span>
                </div>
              ))}
            </div>
            <Button className="mt-5 h-10 w-full rounded-full bg-po-primary text-sm font-semibold text-white hover:bg-po-primary-hover">
              Xác nhận lịch hẹn
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
