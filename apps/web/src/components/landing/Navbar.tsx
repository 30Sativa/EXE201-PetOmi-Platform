import { useEffect, useState } from "react"
import { Heart, Menu, PawPrint, Stethoscope, X } from "lucide-react"
import { Link } from "react-router-dom"

import type { NavLink } from "@/types"

interface NavbarProps {
  links?: NavLink[]
}

const defaultLinks: NavLink[] = [
  { label: "Tính năng", href: "#services" },
  { label: "Đặt lịch", href: "#booking" },
  { label: "Bác sĩ", href: "#veterinary" },
  { label: "Quản trị", href: "#admin" },
  { label: "Câu hỏi", href: "#faq" },
]

export default function Navbar({ links = defaultLinks }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  // Đổi nền navbar khi cuộn xuống
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Khóa scroll nền khi menu mobile mở
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-po-border bg-po-bg/95 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-po-bg/70 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex w-[calc(100%_-_24px)] max-w-[1200px] items-center justify-between gap-3 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 text-sm font-extrabold text-po-text no-underline">
          <span className="grid size-10 place-items-center rounded-2xl bg-po-primary text-white shadow-lg shadow-orange-200/40 transition-transform duration-300 hover:scale-105 hover:rotate-6">
            <PawPrint className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base">PetOmi</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-semibold text-po-text-muted md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative rounded-full px-3 py-2 transition-colors after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-po-primary after:transition-transform after:duration-300 hover:bg-white hover:text-po-text hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/for-clinics"
            className="hidden items-center gap-1.5 rounded-full border border-po-border px-3 py-2 text-sm font-semibold text-po-text-muted transition hover:border-po-primary hover:text-po-text lg:inline-flex"
          >
            <Stethoscope className="size-4" />
            Dành cho phòng khám
          </Link>
          <Link
            to="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-po-text-muted transition hover:text-po-text md:inline-flex"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0 max-[430px]:px-3"
          >
            <Heart className="size-4" />
            Đăng ký <span className="max-[430px]:hidden">miễn phí</span>
          </Link>

          {/* Nút mở menu trên mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex size-10 items-center justify-center rounded-full border border-po-border text-po-text transition hover:bg-white md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-po-border bg-po-bg/98 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out md:hidden ${
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto flex w-[calc(100%_-_24px)] max-w-[1200px] flex-col gap-1 py-3" aria-label="Mobile">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-po-text-muted transition hover:bg-white hover:text-po-text"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 grid gap-2 border-t border-po-border pt-3">
            <Link
              to="/for-clinics"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-2xl border border-po-border px-4 py-3 text-sm font-semibold text-po-text-muted transition hover:border-po-primary hover:text-po-text"
            >
              <Stethoscope className="size-4" />
              Dành cho phòng khám
            </Link>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-po-text-muted transition hover:bg-white hover:text-po-text"
            >
              Đăng nhập
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
