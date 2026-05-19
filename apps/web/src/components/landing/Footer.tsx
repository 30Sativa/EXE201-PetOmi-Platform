import { ArrowUpRight, PawPrint } from "lucide-react"
import { Link } from "react-router-dom"

import { useInView } from "../../lib/useInView"

const footerLinks = [
  {
    title: "Chức năng",
    links: [
      { label: "Tư vấn AI", href: "#services" },
      { label: "Hồ sơ thú cưng", href: "#services" },
      { label: "Đặt lịch khám", href: "#booking" },
      { label: "Chia sẻ dữ liệu", href: "#services" },
    ],
  },
  {
    title: "Phòng khám",
    links: [
      { label: "Cổng cho bác sĩ", href: "#veterinary" },
      { label: "Quản lý lịch hẹn", href: "#booking" },
      { label: "Hàng đợi", href: "#booking" },
      { label: "Kết quả khám", href: "#veterinary" },
    ],
  },
  {
    title: "Quản trị",
    links: [
      { label: "Duyệt phòng khám", href: "#admin" },
      { label: "Quản lý người dùng", href: "#admin" },
      { label: "Nhật ký hoạt động", href: "#admin" },
      { label: "Bảo mật dữ liệu", href: "#admin" },
    ],
  },
]

export default function Footer() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <footer ref={ref as React.RefObject<HTMLElement>} className="border-t border-po-border bg-white/90">
      <div className="mx-auto w-[min(100%-24px,1200px)] py-12">
        <div className={`rounded-[32px] border border-po-border bg-po-surface-muted px-6 py-10 text-center shadow-sm transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Bắt đầu ngay hôm nay</p>
          <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Chăm sóc thú cưng tốt hơn, bắt đầu từ hôm nay.</h2>
          <p className="mt-3 text-sm text-po-text-muted">
            Miễn phí tư vấn AI, đặt lịch khám và theo dõi sức khỏe thú cưng ngay hôm nay.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:bg-po-primary-hover hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
          >
            Dùng thử miễn phí
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className={`mt-12 grid gap-10 transition-all duration-500 delay-150 md:grid-cols-[1.1fr_1.9fr] ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div>
            <Link to="/" className="flex items-center gap-2 text-sm font-extrabold text-po-text no-underline">
              <span className="grid size-10 place-items-center rounded-2xl bg-po-primary text-white">
                <PawPrint className="size-5" />
              </span>
              <span className="text-base">PetOmi</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-po-text-muted">
              Nền tảng chăm sóc thú cưng kết nối chủ nuôi, bác sĩ thú y và quản trị viên — giúp mọi thứ trở nên dễ dàng hơn.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {footerLinks.map((column) => (
              <div key={column.title} className="grid gap-2 text-sm">
                <p className="font-semibold text-po-text">{column.title}</p>
                {column.links.map((link) => (
                  <a key={link.label} href={link.href} className="text-po-text-muted transition hover:text-po-text">
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-po-border pt-6 text-xs text-po-text-subtle sm:flex-row sm:items-center">
          <span>© 2026 PetOmi Platform. All rights reserved.</span>
          <span>Built for EXE201 clinic operations.</span>
        </div>
      </div>
    </footer>
  )
}
