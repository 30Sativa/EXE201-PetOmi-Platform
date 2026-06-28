import { Link } from "react-router-dom"
import { CalendarDays, Clock, ArrowRight } from "lucide-react"

import Seo from "@/components/common/Seo"
import Footer from "@/components/landing/Footer"
import Navbar from "@/components/landing/Navbar"
import { getSortedPosts } from "@/config/blogPosts"
import { buildBlogSchema } from "@/config/structuredData"

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })
}

export default function BlogListPage() {
  const posts = getSortedPosts()

  return (
    <main className="min-h-screen overflow-x-hidden text-po-text">
      <Seo
        title="Cẩm nang chăm sóc thú cưng"
        description="Cẩm nang PetOmi: hướng dẫn nhận biết triệu chứng, lịch tiêm phòng, chăm sóc chó mèo và biết khi nào cần đưa thú cưng đến bác sĩ thú y."
        path="/blog"
        jsonLd={buildBlogSchema(posts)}
      />
      <Navbar />

      <section className="bg-po-bg">
        <div className="mx-auto w-[calc(100%_-_24px)] max-w-[900px] py-16 text-center sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-po-primary-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-po-primary">
            Cẩm nang
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight text-po-text sm:text-4xl">
            Cẩm nang chăm sóc thú cưng
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-po-text-muted">
            Những bài viết giúp bạn hiểu thú cưng hơn: nhận biết dấu hiệu bất thường, chuẩn bị trước khi đi khám và chăm sóc bé khỏe mạnh mỗi ngày.
          </p>
        </div>
      </section>

      <section className="mx-auto w-[calc(100%_-_24px)] max-w-[1100px] pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-po-border bg-white no-underline shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[16/10] overflow-hidden bg-po-surface-muted">
                <img
                  src={post.cover}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-po-primary-soft px-2.5 py-1 text-[11px] font-semibold text-po-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug text-po-text transition group-hover:text-po-primary">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-po-text-muted">
                  {post.description}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-po-text-subtle">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {formatDate(post.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {post.readingMinutes} phút đọc
                  </span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-po-primary">
                  Đọc tiếp
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
