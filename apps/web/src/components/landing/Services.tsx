import { HeartPulse, PawPrint, ShieldPlus, Sparkles } from "lucide-react"

import { useInView } from "../../lib/useInView"

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
    <section ref={ref as React.RefObject<HTMLElement>} id="services" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className={`transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Tính năng nổi bật</p>
            <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">
              Mọi thứ bạn cần để chăm sóc thú cưng tốt hơn.
            </h2>
          </div>
          <p className={`max-w-md text-sm text-po-text-muted transition-all duration-500 delay-100 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Từ lúc mới nuôi đến khi trưởng thành, PetOmi đồng hành cùng bạn và thú cưng trong suốt hành trình.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, i) => {
            const Icon = service.icon
            return (
              <article
                key={service.title}
                className={`group rounded-[28px] border border-po-border bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-po-text">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-po-text-muted">{service.description}</p>
                <span className="mt-5 inline-flex rounded-full bg-po-surface-muted px-3 py-1 text-xs font-semibold text-po-text-subtle">
                  {service.tag}
                </span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
