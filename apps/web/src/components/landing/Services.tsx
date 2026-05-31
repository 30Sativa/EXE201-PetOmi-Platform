import { HeartPulse, PawPrint, ShieldPlus, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import { useInView } from "@/hooks"

interface ServiceItem {
  title: string
  description: string
  icon: typeof PawPrint
  tag: string
}

const services: ServiceItem[] = [
  {
    title: "Tư vấn sức khỏe 24/7",
    description: "Mô tả triệu chứng bằng lời, AI sẽ phân tích và cảnh báo mức độ nghiêm trọng ngay lập tức.",
    icon: Sparkles,
    tag: "Cảnh báo nguy cấp",
  },
  {
    title: "Hồ sơ sức khỏe trọn đời",
    description: "Tất cả lịch sử khám, tiêm phòng, đơn thuốc được lưu lại suốt đời và chia sẻ với bác sĩ khi cần.",
    icon: PawPrint,
    tag: "Theo dõi mãi mãi",
  },
  {
    title: "Tìm phòng khám gần nhất",
    description: "Tìm phòng khám theo vị trí, xem đánh giá thật từ người đã khám và đặt lịch chỉ trong vài giây.",
    icon: ShieldPlus,
    tag: "Đặt lịch nhanh",
  },
  {
    title: "Quản lý phòng khám",
    description: "Bác sĩ và lễ tân quản lý lịch hẹn, hàng đợi, kết quả khám và hóa đơn ở một nơi duy nhất.",
    icon: HeartPulse,
    tag: "Vet Portal",
  },
]

export default function Services() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="services" className="py-20 md:py-24">
      <div className="mx-auto w-[calc(100%_-_24px)] max-w-[1200px]">
        <div id="clinic" className="relative -top-24" aria-hidden="true" />
        <div className="grid gap-5 md:grid-cols-[0.9fr_0.7fr] md:items-end md:justify-between">
          <div className={`transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Tính năng nổi bật</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
              Ít bước hơn khi thú cưng cần được chăm sóc.
            </h2>
          </div>
          <p className={`max-w-md text-base leading-7 text-po-text-muted transition-all duration-500 delay-100 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Từ triệu chứng ban đầu đến lịch khám tiếp theo, PetOmi giữ thông tin nhất quán để chủ nuôi và bác sĩ cùng nhìn một bức tranh.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          <article
            className={`group relative min-h-[420px] overflow-hidden rounded-[28px] bg-po-text text-white shadow-xl shadow-orange-200/20 transition-all duration-500 lg:col-span-7 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <img
              src="/app-mockup.png"
              alt="Giao diện PetOmi hiển thị tư vấn triệu chứng và nhắc lịch chăm sóc"
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(74,47,33,0.12),_rgba(74,47,33,0.82))]" />
            <div className="relative flex h-full min-h-[420px] flex-col justify-end p-6 md:p-8">
              <span className="mb-4 w-fit bg-white/90 px-3 py-1 text-xs font-semibold text-po-text">AI tư vấn 24/7</span>
              <h3 className="max-w-xl text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Khi có dấu hiệu lạ, bạn biết việc tiếp theo cần làm.
              </h3>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/[0.82]">
                Mô tả triệu chứng bằng lời, nhận cảnh báo mức độ nghiêm trọng, rồi đặt lịch hoặc theo dõi tại nhà theo hướng dẫn rõ ràng.
              </p>
              <Link
                to="/register"
                className="mt-6 inline-flex w-fit items-center rounded-full bg-po-primary px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover focus-visible:shadow-[var(--po-focus-ring)] active:translate-y-0"
              >
                Dùng thử miễn phí
              </Link>
            </div>
          </article>

          <div className="grid gap-5 lg:col-span-5">
            <article
              className={`rounded-[24px] bg-white p-6 shadow-sm transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "80ms" }}
            >
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                  <PawPrint className="size-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold leading-snug text-po-text">Hồ sơ sức khỏe trọn đời</h3>
                  <p className="mt-2 text-sm leading-6 text-po-text-muted">
                    Lịch sử khám, tiêm phòng và đơn thuốc ở cùng một nơi, dễ chia sẻ khi đến phòng khám mới.
                  </p>
                </div>
              </div>
            </article>
            <div className="grid gap-5 sm:grid-cols-2">
              {services.slice(2).map((service, i) => {
                const Icon = service.icon
                return (
                  <article
                    key={service.title}
                    className={`rounded-[24px] border border-po-border bg-po-surface-muted/70 p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-md ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                    style={{ transitionDelay: `${160 + i * 80}ms` }}
                  >
                    <Icon className="size-5 text-po-primary" />
                    <h3 className="mt-4 text-base font-semibold leading-snug text-po-text">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-po-text-muted">{service.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-po-border pt-6 sm:grid-cols-3">
          {services.map((service, i) => {
            const Icon = service.icon
            return (
              <div
                key={service.title}
                className={`flex items-center gap-3 transition-all duration-500 ${i === 0 ? "sm:hidden" : ""} ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <Icon className="size-4 shrink-0 text-po-primary" />
                <span className="text-sm font-semibold text-po-text-subtle">{service.tag}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
