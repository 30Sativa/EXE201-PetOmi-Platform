import { ArrowUpRight, PawPrint } from "lucide-react"
import { Link } from "react-router-dom"

const footerLinks = [
  {
    title: "Nền tảng",
    links: [
      { label: "AI tư vấn", href: "#services" },
      { label: "Hồ sơ thú cưng", href: "#services" },
      { label: "Đặt lịch", href: "#booking" },
      { label: "Chia sẻ dữ liệu", href: "#services" },
    ],
  },
  {
    title: "Clinic",
    links: [
      { label: "Vet portal", href: "#veterinary" },
      { label: "Lịch hẹn", href: "#booking" },
      { label: "Queue", href: "#booking" },
      { label: "Kết quả khám", href: "#veterinary" },
    ],
  },
  {
    title: "Admin",
    links: [
      { label: "Duyệt clinic", href: "#admin" },
      { label: "User management", href: "#admin" },
      { label: "Audit log", href: "#admin" },
      { label: "GDPR", href: "#admin" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-po-border bg-white/90">
      <div className="mx-auto w-[min(100%-24px,1200px)] py-12">
        <div className="rounded-[32px] border border-po-border bg-po-surface-muted px-6 py-10 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Bắt đầu ngay</p>
          <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Một nền tảng cho Owner, Vet và Admin.</h2>
          <p className="mt-3 text-sm text-po-text-muted">
            AI tư vấn, đặt lịch, hồ sơ sức khỏe số và luồng duyệt clinic rõ ràng.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:bg-po-primary-hover"
          >
            Bắt đầu miễn phí
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.1fr_1.9fr]">
          <div>
            <Link to="/" className="flex items-center gap-2 text-sm font-extrabold text-po-text no-underline">
              <span className="grid size-10 place-items-center rounded-2xl bg-po-primary text-white">
                <PawPrint className="size-5" />
              </span>
              <span className="text-base">PetOmi</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-po-text-muted">
              Nền tảng Pet Advisor AI kết nối chủ nuôi, bác sĩ và admin bằng dữ liệu đồng bộ.
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
