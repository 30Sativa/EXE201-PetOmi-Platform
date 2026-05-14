import { useMemo, useState } from "react"

const searchItems = [
  "Tư vấn AI triệu chứng",
  "Tìm phòng khám gần đây",
  "Hồ sơ tiêm phòng",
  "Đặt lịch khám thú y",
  "Quản lý clinic",
  "Duyệt clinic mới",
]

const stats = [
  ["103+", "Tính năng core"],
  ["3", "Vai trò vận hành"],
  ["24/7", "Theo dõi lịch hẹn"],
  ["2-level", "Cảnh báo khẩn cấp"],
]

const features = [
  {
    title: "AI tư vấn sức khỏe",
    text: "Phân loại triệu chứng, cảnh báo khẩn cấp và gợi ý bước xử lý tiếp theo.",
    tags: ["RAG-based", "Urgency"],
  },
  {
    title: "Hồ sơ sức khỏe số",
    text: "Lưu lịch sử khám, tiêm phòng, đơn thuốc và chia sẻ có kiểm soát.",
    tags: ["Lifetime ID", "Sharing"],
  },
  {
    title: "Tìm phòng khám",
    text: "Tìm clinic phù hợp, xem trạng thái và đặt lịch khám thú y nhanh hơn.",
    tags: ["Clinic", "Booking"],
  },
  {
    title: "Clinic workspace",
    text: "Không gian cho clinic quản lý thông tin, bác sĩ, dịch vụ và lịch hẹn.",
    tags: ["Vet", "Operations"],
  },
]

const workflow = [
  ["01", "Tạo hồ sơ", "Chủ nuôi tạo hồ sơ thú cưng và cập nhật thông tin nền."],
  ["02", "Nhận tư vấn", "AI hỗ trợ phân loại triệu chứng và đề xuất hành động."],
  ["03", "Đặt lịch", "Người dùng chọn clinic, bác sĩ và khung giờ phù hợp."],
  ["04", "Theo dõi", "Lịch sử khám và nhắc lịch được gom về một nơi."],
]

const footerColumns = [
  ["Nền tảng", "AI tư vấn", "Hồ sơ thú cưng", "Tìm phòng khám", "Lịch hẹn"],
  ["Clinic", "Quản lý clinic", "Bác sĩ", "Dịch vụ", "Admin review"],
  ["Tài khoản", "Đăng nhập", "Đăng ký", "Xác minh email", "Quên mật khẩu"],
]

const getFooterHref = (label: string) => {
  if (label === "Đăng nhập") return "#/login"
  if (label === "Đăng ký") return "#/register"
  if (label.includes("Clinic") || label.includes("clinic") || label.includes("phòng khám")) return "#clinic"
  return "#features"
}

export default function LandingPage() {
  const [searchValue, setSearchValue] = useState("")

  const searchResults = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    if (!keyword) return searchItems.slice(0, 4)
    return searchItems.filter((item) => item.toLowerCase().includes(keyword)).slice(0, 4)
  }, [searchValue])

  return (
    <main className="min-h-screen overflow-x-hidden text-po-text">
      <header className="sticky top-0 z-50 border-b border-po-border bg-white/90 backdrop-blur-xl motion-safe:animate-fade-in">
        <div className="mx-auto grid w-[min(100%-24px,1280px)] grid-cols-[auto_1fr_auto] items-center gap-3 py-3 lg:grid-cols-[auto_minmax(240px,380px)_auto_auto]">
          <a href="#" aria-label="Trang chủ PetOmi" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
            <span className="grid size-9 place-items-center rounded-md bg-po-primary text-sm text-white">P</span>
            <span>PetOmi</span>
          </a>

          <form className="relative order-3 col-span-full lg:order-none lg:col-span-1" role="search" onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="site-search">
              Tìm kiếm
            </label>
            <input
              id="site-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Tìm tính năng, phòng khám..."
              className="h-11 w-full rounded-full border border-po-border bg-po-surface-muted px-4 text-sm text-po-text transition focus:border-po-primary focus:bg-white"
            />
            <div className="absolute inset-x-0 top-[calc(100%+8px)] hidden rounded-lg border border-po-border bg-white p-3 shadow-2xl focus-within:grid has-[:focus]:grid">
              <p className="mb-2 text-xs font-extrabold uppercase text-po-text-subtle">{searchValue ? "Kết quả gợi ý" : "Tìm nhanh"}</p>
              <div className="grid gap-1">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <a key={item} href="#features" className="rounded-md px-3 py-2 text-sm font-semibold text-po-text-muted no-underline transition hover:bg-po-primary-soft hover:text-po-primary">
                      {item}
                    </a>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-po-text-muted">Chưa có gợi ý phù hợp</p>
                )}
              </div>
            </div>
          </form>

          <nav className="hidden items-center gap-1 rounded-full bg-po-surface-muted p-1 lg:flex" aria-label="Điều hướng chính">
            <a className="rounded-full px-4 py-2 text-sm font-bold text-po-text-muted no-underline transition hover:bg-white hover:text-po-primary" href="#features">
              Tính năng
            </a>
            <a className="rounded-full px-4 py-2 text-sm font-bold text-po-text-muted no-underline transition hover:bg-white hover:text-po-primary" href="#workflow">
              Quy trình
            </a>
            <a className="rounded-full px-4 py-2 text-sm font-bold text-po-text-muted no-underline transition hover:bg-white hover:text-po-primary" href="#clinic">
              Clinic
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a href="#/login" className="hidden px-3 py-2 text-sm font-extrabold text-po-text-muted no-underline transition hover:text-po-primary sm:inline-flex">
              Đăng nhập
            </a>
            <a href="#/register" className="inline-flex h-10 items-center rounded-md bg-po-primary px-4 text-sm font-extrabold text-white no-underline shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-po-primary-hover">
              Bắt đầu
            </a>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[linear-gradient(90deg,rgba(15,23,42,.86),rgba(15,23,42,.62),rgba(15,23,42,.22)),url('/vet-clinic.png')] bg-cover bg-center">
        <div className="pointer-events-none absolute right-[8%] top-28 hidden rounded-lg border border-white/30 bg-white/90 px-4 py-3 text-sm font-extrabold text-po-text shadow-2xl shadow-stone-950/20 motion-safe:animate-float lg:block">
          Clinic review ready
        </div>
        <div className="pointer-events-none absolute bottom-24 right-[18%] hidden rounded-lg border border-white/30 bg-white/85 px-4 py-3 text-sm font-extrabold text-po-primary shadow-2xl shadow-stone-950/20 motion-safe:animate-float [animation-delay:900ms] lg:block">
          AI urgency check
        </div>
        <div className="mx-auto grid min-h-[78svh] w-[min(100%-32px,1280px)] content-center py-20 md:py-28">
          <p className="mb-3 text-xs font-extrabold uppercase text-teal-100 motion-safe:animate-fade-up">Pet Advisor AI Platform</p>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-white motion-safe:animate-fade-up [animation-delay:90ms] md:text-6xl">
            AI chăm sóc sức khỏe thú cưng toàn diện.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 motion-safe:animate-fade-up [animation-delay:160ms] md:text-lg">
            Tư vấn bằng AI, hồ sơ y tế số, tìm phòng khám, đặt lịch và vận hành clinic trong một nền tảng rõ ràng.
          </p>
          <div className="mt-8 flex flex-col gap-3 motion-safe:animate-fade-up [animation-delay:230ms] sm:flex-row">
            <a href="#/register" className="inline-flex h-12 items-center justify-center rounded-md bg-po-primary px-5 text-sm font-extrabold text-white no-underline shadow-xl shadow-teal-950/20 transition hover:-translate-y-0.5 hover:bg-po-primary-hover">
              Tạo tài khoản miễn phí
            </a>
            <a href="#features" className="inline-flex h-12 items-center justify-center rounded-md border border-white/50 bg-white/10 px-5 text-sm font-extrabold text-white no-underline backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">
              Khám phá tính năng
            </a>
          </div>
          <div className="mt-10 grid gap-3 motion-safe:animate-fade-up [animation-delay:300ms] sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/30 bg-white/90 p-4 shadow-xl shadow-stone-950/10 transition hover:-translate-y-1 hover:shadow-2xl">
                <strong className="block text-3xl leading-none text-po-text">{value}</strong>
                <span className="mt-1 block text-sm font-semibold text-po-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="py-16 md:py-20">
        <div className="mx-auto w-[min(100%-32px,1120px)]">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-extrabold uppercase text-po-accent">Cách hoạt động</p>
            <h2 className="text-3xl font-extrabold leading-tight text-po-text md:text-4xl">4 bước đơn giản để bắt đầu.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map(([number, title, text]) => (
              <article key={number} className="rounded-lg border border-po-border bg-white p-5 shadow-sm transition motion-safe:animate-fade-up hover:-translate-y-1 hover:border-teal-700/30 hover:shadow-xl">
                <span className="grid size-11 place-items-center rounded-md bg-po-primary text-sm font-extrabold text-white">{number}</span>
                <h3 className="mt-4 text-lg font-extrabold text-po-text">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-po-text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-16 md:py-20">
        <div className="mx-auto w-[min(100%-32px,1280px)]">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-extrabold uppercase text-po-accent">Core features</p>
              <h2 className="text-3xl font-extrabold leading-tight text-po-text md:text-4xl">Đủ nghiêm túc cho vận hành clinic, vẫn dễ dùng cho chủ nuôi.</h2>
            </div>
            <a href="#/register" className="inline-flex h-11 items-center justify-center rounded-md border border-po-border px-4 text-sm font-extrabold text-po-primary no-underline transition hover:border-po-primary hover:bg-po-primary-soft">
              Dùng thử miễn phí
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-lg border border-po-border bg-po-bg p-5 transition motion-safe:animate-fade-up hover:-translate-y-1 hover:border-teal-700/30 hover:bg-white hover:shadow-xl">
                <h3 className="text-xl font-extrabold text-po-text">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-po-text-muted">{feature.text}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-po-text-muted ring-1 ring-po-border">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="clinic" className="py-16 md:py-20">
        <div className="mx-auto grid w-[min(100%-32px,1180px)] items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div className="overflow-hidden rounded-lg border border-po-border bg-white shadow-2xl shadow-stone-900/10 transition motion-safe:animate-fade-up hover:-translate-y-1">
            <img src="/app-mockup.png" alt="Giao diện ứng dụng PetOmi" className="aspect-[4/5] w-full object-cover" />
          </div>
          <div className="motion-safe:animate-fade-up [animation-delay:120ms]">
            <p className="mb-3 text-xs font-extrabold uppercase text-po-accent">Clinic operations</p>
            <h2 className="text-3xl font-extrabold leading-tight text-po-text md:text-4xl">Clinic, bác sĩ và admin cùng nhìn một luồng trạng thái.</h2>
            <p className="mt-4 text-base leading-7 text-po-text-muted">
              Clinic mới có thể được tạo, gửi duyệt, phê duyệt hoặc từ chối. Mọi trạng thái đều rõ ràng để frontend không phải đoán.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Pending review", "Vet verified", "Clinic active", "Secure session"].map((item) => (
                <span key={item} className="rounded-lg border border-po-border bg-white px-4 py-3 text-sm font-bold text-po-text-muted">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-po-border bg-white py-12">
        <div className="mx-auto grid w-[min(100%-32px,1280px)] gap-10 motion-safe:animate-fade-up lg:grid-cols-[1fr_1.5fr]">
          <div>
            <a href="#" aria-label="Trang chủ PetOmi" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
              <span className="grid size-9 place-items-center rounded-md bg-po-primary text-sm text-white">P</span>
              <span>PetOmi</span>
            </a>
            <p className="mt-4 max-w-md text-sm leading-6 text-po-text-muted">
              Nền tảng AI chăm sóc sức khỏe thú cưng, kết nối chủ nuôi, phòng khám và bác sĩ thú y bằng quy trình rõ ràng.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {footerColumns.map(([title, ...links]) => (
              <nav key={title} aria-label={title} className="grid content-start gap-2">
                <h3 className="mb-2 text-sm font-extrabold text-po-text">{title}</h3>
                {links.map((link) => (
                  <a key={link} href={getFooterHref(link)} className="text-sm text-po-text-muted no-underline transition hover:text-po-primary">
                    {link}
                  </a>
                ))}
              </nav>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-10 flex w-[min(100%-32px,1280px)] flex-col gap-2 border-t border-po-border pt-6 text-sm text-po-text-subtle sm:flex-row sm:justify-between">
          <span>© 2026 PetOmi Platform</span>
          <span>Built for EXE201 clinic operations</span>
        </div>
      </footer>
    </main>
  )
}
