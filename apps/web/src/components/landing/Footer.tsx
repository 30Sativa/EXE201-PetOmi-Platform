import { ArrowUpRight, PawPrint } from "lucide-react"
import { Link } from "react-router-dom"

import { useInView } from "@/hooks"

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
    <footer ref={ref as React.RefObject<HTMLElement>} className="border-t border-po-border bg-white">
      <div className="mx-auto w-[calc(100%_-_24px)] max-w-[1200px] py-14">
        <div className={`relative overflow-hidden rounded-[30px] bg-po-text px-6 py-12 text-white shadow-xl shadow-orange-200/25 transition-all duration-500 md:px-10 md:py-14 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <img
            src="/hero-pets-new.png"
            alt="Bác sĩ thú y đang chăm sóc thú cưng"
            className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-[0.55] md:block"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(74,47,33,0.96)_0%,_rgba(74,47,33,0.82)_52%,_rgba(74,47,33,0.18)_100%)]" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Bắt đầu ngay hôm nay</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Có một nơi để theo dõi sức khỏe thú cưng từ hôm nay.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/[0.78]">
              Miễn phí tư vấn AI, đặt lịch khám và lưu hồ sơ sức khỏe thú cưng trong cùng một tài khoản.
            </p>
            <Link
              to="/register"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl focus-visible:shadow-[var(--po-focus-ring)] active:translate-y-0"
            >
              Tạo tài khoản miễn phí
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
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
              PetOmi giúp chủ nuôi ghi triệu chứng, lưu hồ sơ và chuẩn bị thông tin cần thiết trước khi gặp bác sĩ thú y.
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

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-po-border pt-6 text-xs text-po-text-subtle sm:flex-row sm:items-center">
          <span>© 2026 PetOmi Platform. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#faq" className="transition hover:text-po-text">
              Privacy
            </a>
            <a href="#faq" className="transition hover:text-po-text">
              Terms
            </a>
            <span>Built for EXE201 clinic operations.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
