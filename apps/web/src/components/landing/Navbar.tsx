import { Heart, PawPrint } from "lucide-react"
import { Link } from "react-router-dom"

interface NavLink {
  label: string
  href: string
}

interface NavbarProps {
  links?: NavLink[]
}

const defaultLinks: NavLink[] = [
  { label: "Tính năng", href: "#services" },
  { label: "Đặt lịch", href: "#booking" },
  { label: "Clinic", href: "#veterinary" },
  { label: "Admin", href: "#admin" },
  { label: "Câu hỏi", href: "#faq" },
]

export default function Navbar({ links = defaultLinks }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-po-border bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-[min(100%-24px,1200px)] items-center justify-between gap-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-sm font-extrabold text-po-text no-underline">
          <span className="grid size-10 place-items-center rounded-2xl bg-po-primary text-white shadow-lg shadow-orange-200/40">
            <PawPrint className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base">PetOmi</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full bg-po-surface-muted px-2 py-1 text-sm font-semibold text-po-text-muted md:flex" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-full px-3 py-2 transition hover:bg-white hover:text-po-text">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-po-text-muted transition hover:text-po-text md:inline-flex"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:bg-po-primary-hover"
          >
            <Heart className="size-4" />
            Bắt đầu
          </Link>
        </div>
      </div>
    </header>
  )
}
