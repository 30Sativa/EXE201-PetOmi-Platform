import { ArrowUpRight, PawPrint } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

const footerLinks = [
  { title: "Platform", links: ["AI Care", "Pet profiles", "Bookings", "Adoption"] },
  { title: "Clinics", links: ["Vet dashboard", "Care notes", "Trust badges", "Analytics"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
]

export default function Footer() {
  return (
    <footer className="border-t border-po-border bg-white/90">
      <div className="mx-auto w-[min(100%-24px,1200px)] py-12">
        <div className="rounded-[32px] border border-po-border bg-po-surface-muted px-6 py-10 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Ready to begin?</p>
          <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Create a care plan your pet will love.</h2>
          <p className="mt-3 text-sm text-po-text-muted">
            Start with free AI guidance, then connect with vetted clinics when you are ready.
          </p>
          <Button className="mt-6 h-12 rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 hover:bg-po-primary-hover">
            Join PetOmi
            <ArrowUpRight className="size-4" />
          </Button>
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
              Premium pet-care experiences for modern families. Built with warm AI guidance and trusted clinical
              workflows.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {footerLinks.map((column) => (
              <div key={column.title} className="grid gap-2 text-sm">
                <p className="font-semibold text-po-text">{column.title}</p>
                {column.links.map((link) => (
                  <a key={link} href="#" className="text-po-text-muted transition hover:text-po-text">
                    {link}
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
