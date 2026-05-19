import { CalendarDays, Clock, MapPin, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useInView } from "../../lib/useInView"

interface Slot {
  time: string
  label: string
}

const slots: Slot[] = [
  { time: "09:30", label: "Sáng" },
  { time: "11:00", label: "Cuối sáng" },
  { time: "16:45", label: "Chiều" },
]

export default function BookingPreview() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="booking" className="py-16">
      <div className="mx-auto grid w-[min(100%-24px,1200px)] gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div className={`grid gap-4 transition-all duration-500 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Đặt lịch khám</p>
          <h2 className="text-3xl font-extrabold text-po-text md:text-4xl">Đặt lịch nhanh, phù hợp với tình trạng của thú cưng.</h2>
          <p className="text-base leading-7 text-po-text-muted">
            AI sẽ gợi ý phòng khám và giờ khám phù hợp. Bạn thấy rõ vị trí trong hàng đợi, phòng khám nhận thông tin đầy đủ trước khi bạn đến.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: MapPin, title: "Phòng khám gần bạn", text: "Tìm trong bán kính 1-10km." },
              { icon: ShieldCheck, title: "Đánh giá thật", text: "Xem review từ người đã khám thật." },
              { icon: CalendarDays, title: "Lịch khám cá nhân", text: "Nhắc nhở trước giờ khám." },
              { icon: Clock, title: "Quét QR check-in", text: "Đến quầy, quét và chờ gọi." },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className={`rounded-2xl border border-po-border bg-white p-4 transition-all duration-400 hover:-translate-y-0.5 hover:shadow-md ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <Icon className="size-5 text-po-primary" />
                  <p className="mt-2 text-sm font-semibold text-po-text">{item.title}</p>
                  <p className="text-xs text-po-text-muted">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
        <div className={`rounded-[32px] border border-po-border bg-white p-6 shadow-xl transition-all duration-500 delay-150 ${inView ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-6 scale-95"}`}>
          <div className="rounded-[24px] bg-po-surface-muted p-5">
            <p className="text-xs font-semibold uppercase text-po-text-subtle">Lịch hẹn</p>
            <h3 className="mt-2 text-lg font-semibold text-po-text">PetOmi Clinic District 2</h3>
            <p className="text-xs text-po-text-muted">Cách bạn 2.1 km</p>
            <div className="mt-4 space-y-2">
              {slots.map((slot) => (
                <div key={slot.time} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-3 py-2 text-sm">
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
