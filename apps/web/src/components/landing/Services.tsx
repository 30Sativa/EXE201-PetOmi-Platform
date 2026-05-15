import { HeartPulse, PawPrint, ShieldPlus, Sparkles } from "lucide-react"

interface ServiceItem {
  title: string
  description: string
  icon: typeof PawPrint
  tag: string
}

const services: ServiceItem[] = [
  {
    title: "AI triage + RAG",
    description: "Phân loại intent, cảnh báo khẩn và gợi ý bước xử lý dựa trên knowledge base.",
    icon: Sparkles,
    tag: "Cảnh báo 2-level",
  },
  {
    title: "Hồ sơ sức khỏe số",
    description: "Một ID suốt vòng đời: lịch sử khám, tiêm phòng, đơn thuốc và chia sẻ có kiểm soát.",
    icon: PawPrint,
    tag: "Hồ sơ suốt đời",
  },
  {
    title: "Smart clinic locator",
    description: "Tìm clinic gần đây, lọc theo chuyên khoa, đánh giá và đặt lịch nhanh.",
    icon: ShieldPlus,
    tag: "Booking thông minh",
  },
  {
    title: "Clinic operations",
    description: "Quản lý bác sĩ, dịch vụ, lịch hẹn, queue và đồng bộ kết quả sau khám.",
    icon: HeartPulse,
    tag: "Clinic workspace",
  },
]

export default function Services() {
  return (
    <section id="services" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Tính năng core</p>
            <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">
              Đủ nghiêm túc cho vận hành clinic, vẫn dễ dùng cho chủ nuôi.
            </h2>
          </div>
          <p className="max-w-md text-sm text-po-text-muted">
            Kết nối Owner, Vet và Admin bằng một luồng dữ liệu rõ ràng và tự động.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <article
                key={service.title}
                className="group rounded-[28px] border border-po-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
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
