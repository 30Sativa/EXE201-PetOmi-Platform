import { CheckCircle2, Headset, Stethoscope } from "lucide-react"

const benefits = [
  "Xem AI pre-check summary trước khi khám",
  "Quản lý lịch hẹn, queue và dịch vụ",
  "Đồng bộ chẩn đoán, đơn thuốc và kết quả",
]

export default function VetConsultation() {
  return (
    <section id="veterinary" className="py-16">
      <div className="mx-auto grid w-[min(100%-24px,1200px)] gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="rounded-[32px] border border-po-border bg-white p-6 shadow-xl">
          <img
            src="/vet-clinic.png"
            alt="Warm veterinary consultation"
            className="aspect-4/3 w-full rounded-[24px] object-cover"
          />
          <div className="mt-5 grid gap-3">
            {[Headset, Stethoscope].map((Icon, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl border border-po-border bg-po-surface-muted px-4 py-3">
                <Icon className="size-5 text-po-primary" />
                <span className="text-sm font-semibold text-po-text">Clinic workspace cho bác sĩ & lễ tân</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Vet portal</p>
          <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">
            Clinic quản lý bệnh nhân và lịch hẹn trong một luồng.
          </h2>
          <p className="mt-4 text-base leading-7 text-po-text-muted">
            Từ check-in đến khám và hậu khám, dữ liệu được đồng bộ về owner app ngay lập tức.
          </p>
          <div className="mt-6 grid gap-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 rounded-2xl border border-po-border bg-white px-4 py-3">
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
