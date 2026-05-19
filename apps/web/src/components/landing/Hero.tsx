import { useState, useEffect } from "react"
import { ArrowUpRight, CalendarCheck, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Highlight {
  title: string
  description: string
  icon: typeof Sparkles
}

const highlights: Highlight[] = [
  {
    title: "Cảnh báo khẩn tức thì",
    description: "Biết ngay mức độ nguy hiểm và gọi cấp cứu nếu cần.",
    icon: Sparkles,
  },
  {
    title: "Đặt lịch nhanh",
    description: "Gợi ý phòng khám phù hợp và giờ khám ngay khi cần.",
    icon: CalendarCheck,
  },
]

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,247,237,0.96),_rgba(255,255,255,0.9),_rgba(236,253,245,0.85))]">
      <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full bg-[radial-gradient(circle,_rgba(253,186,116,0.35),_rgba(253,186,116,0))]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-80 translate-x-16 translate-y-12 rounded-full bg-[radial-gradient(circle,_rgba(110,231,183,0.35),_rgba(110,231,183,0))]" />

      <div className="mx-auto grid w-[min(100%-24px,1200px)] gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div className={`flex flex-col justify-center transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="w-fit rounded-full border border-po-border bg-white px-3 py-1 text-xs font-semibold uppercase text-po-text-muted">
            Nền tảng chăm sóc thú cưng
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
            Yên tâm hơn khi biết thú cưng của bạn đang khỏe.
          </h1>
          <p className="mt-4 text-base leading-7 text-po-text-muted md:text-lg">
            Tư vấn sức khỏe thú cưng 24/7, theo dõi lịch tiêm & khám, đặt lịch phòng khám — tất cả trong một ứng dụng dễ dùng cho chủ nuôi.
          </p>
          <div className={`mt-6 flex flex-wrap gap-3 transition-all duration-700 delay-100 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Button className="h-12 rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0">
              Dùng thử miễn phí
              <ArrowUpRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full border-po-border bg-white px-6 text-sm font-semibold text-po-text transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              Xem cách hoạt động
            </Button>
          </div>
          <div className={`mt-8 grid gap-4 transition-all duration-700 delay-200 ease-out sm:grid-cols-2 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {highlights.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-3xl border border-po-border bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-po-text">{item.title}</p>
                      <p className="text-xs leading-5 text-po-text-muted">{item.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`relative transition-all duration-700 delay-150 ease-out ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}>
          <div className="absolute left-6 top-6 hidden rounded-3xl border border-po-border bg-white px-4 py-3 text-xs font-semibold text-po-text shadow-lg md:block">
            Được đánh giá 4.9 sao
          </div>
          <div className="rounded-[32px] border border-po-border bg-white/90 p-4 shadow-xl">
            <div className="rounded-[24px] bg-gradient-to-br from-orange-100 via-amber-50 to-emerald-50 p-6">
              <div className="rounded-[20px] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-po-text">Bé Mèo, 2 tuổi</p>
                    <p className="text-xs text-po-text-muted">Mèo Anh lông ngắn</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Khỏe mạnh
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-po-border bg-po-surface-muted px-3 py-2 text-xs text-po-text-muted">
                    AI phân tích: theo dõi thêm và đặt lịch khám trong 48h.
                  </div>
                  <div className="rounded-2xl border border-po-border bg-white px-3 py-2 text-xs text-po-text-muted">
                    Gợi ý: Thứ Sáu, 9:30 — PetOmi Clinic District 2
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] border border-white/70 bg-white/70 p-4 text-xs text-po-text-muted">
                Lịch sử khám, tiêm phòng được lưu lại và chia sẻ với bác sĩ khi cần.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
