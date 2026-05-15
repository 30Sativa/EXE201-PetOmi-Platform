import { AlertTriangle } from "lucide-react"
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom"

export default function ErrorPage() {
  const error = useRouteError()

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong"

  const description = isRouteErrorResponse(error)
    ? "Trang hiện tại gặp lỗi khi tải. Hãy quay lại sau hoặc thử lại từ trang chủ."
    : "Đã có lỗi xảy ra. Vui lòng thử lại sau."

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,247,237,0.96),rgba(255,255,255,0.9),rgba(236,253,245,0.85))] text-po-text">
      <div className="mx-auto grid min-h-screen w-[min(100%-24px,1000px)] place-items-center py-16">
        <section className="w-full max-w-2xl rounded-[32px] border border-po-border bg-white/90 p-8 text-center shadow-xl">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-po-text md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-po-text-muted">{description}</p>
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
          >
            Về trang chủ
          </Link>
        </section>
      </div>
    </main>
  )
}
