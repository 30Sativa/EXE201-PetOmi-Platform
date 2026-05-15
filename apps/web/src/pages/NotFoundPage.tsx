import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,247,237,0.96),rgba(255,255,255,0.9),rgba(236,253,245,0.85))] text-po-text">
      <div className="mx-auto grid min-h-screen w-[min(100%-24px,1000px)] place-items-center py-16">
        <section className="w-full max-w-2xl rounded-[32px] border border-po-border bg-white/90 p-8 text-center shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">404</p>
          <h1 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Trang bạn tìm không tồn tại.</h1>
          <p className="mt-3 text-sm leading-6 text-po-text-muted">
            Hãy quay lại trang chủ để tiếp tục khám phá PetOmi.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
          >
            <ArrowLeft className="size-4" />
            Về trang chủ
          </Link>
        </section>
      </div>
    </main>
  )
}
