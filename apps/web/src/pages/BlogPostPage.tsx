import { Link, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, Clock, Heart, Info } from "lucide-react"

import Seo from "@/components/common/Seo"
import Footer from "@/components/landing/Footer"
import Navbar from "@/components/landing/Navbar"
import { getPostBySlug, getSortedPosts } from "@/config/blogPosts"
import { buildArticleSchema } from "@/config/structuredData"
import type { BlogBlock } from "@/types"

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "heading":
      return <h2 className="mt-10 text-2xl font-bold text-po-text">{block.text}</h2>
    case "paragraph":
      return <p className="mt-4 text-base leading-8 text-po-text-muted">{block.text}</p>
    case "list":
      return (
        <ul className="mt-4 grid gap-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-base leading-7 text-po-text-muted">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-po-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case "callout":
      return (
        <div className="mt-6 flex gap-3 rounded-2xl border border-po-primary/30 bg-po-primary-soft p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-po-primary" />
          <p className="text-sm leading-7 text-po-text">{block.text}</p>
        </div>
      )
    default:
      return null
  }
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPostBySlug(slug) : undefined

  // Slug không tồn tại: hiển thị trạng thái không tìm thấy + noindex.
  if (!post) {
    return (
      <main className="min-h-screen overflow-x-hidden text-po-text">
        <Seo title="Không tìm thấy bài viết" noindex />
        <Navbar />
        <section className="mx-auto grid min-h-[50vh] w-[calc(100%_-_24px)] max-w-[700px] place-items-center py-20 text-center">
          <div>
            <h1 className="text-2xl font-bold text-po-text">Không tìm thấy bài viết này.</h1>
            <p className="mt-3 text-sm text-po-text-muted">
              Bài viết có thể đã bị xóa hoặc đường dẫn không đúng.
            </p>
            <Link
              to="/blog"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
            >
              <ArrowLeft className="size-4" />
              Về trang cẩm nang
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  const related = getSortedPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2)

  return (
    <main className="min-h-screen overflow-x-hidden text-po-text">
      <Seo
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        image={post.cover}
        type="article"
        jsonLd={buildArticleSchema(post)}
      />
      <Navbar />

      <article className="mx-auto w-[calc(100%_-_24px)] max-w-[760px] py-12">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-po-text-muted no-underline transition hover:text-po-primary"
        >
          <ArrowLeft className="size-4" />
          Cẩm nang
        </Link>

        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-po-primary-soft px-2.5 py-1 text-[11px] font-semibold text-po-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight text-po-text sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-po-text-subtle">
          <span>{post.author}</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {formatDate(post.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />
            {post.readingMinutes} phút đọc
          </span>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-po-border">
          <img
            src={post.cover}
            alt={post.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>

        <div className="mt-2">
          {post.content.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>

        {/* Khuyến cáo y tế */}
        <p className="mt-10 rounded-2xl bg-po-surface-muted p-4 text-xs leading-6 text-po-text-subtle">
          Nội dung trong bài chỉ mang tính tham khảo, không thay thế chẩn đoán và điều trị của bác sĩ thú y. Khi thú cưng có dấu hiệu bất thường, hãy đưa bé đến cơ sở thú y để được khám trực tiếp.
        </p>

        {/* CTA về sản phẩm */}
        <div className="mt-10 rounded-3xl border border-po-border bg-po-bg p-6 text-center sm:p-8">
          <h2 className="text-xl font-bold text-po-text sm:text-2xl">
            Theo dõi sức khỏe thú cưng cùng PetOmi
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-po-text-muted">
            Ghi lại triệu chứng, lưu hồ sơ sức khỏe và đặt lịch khám — tất cả trong một nơi, để bạn luôn sẵn sàng khi bé cần.
          </p>
          <Link
            to="/register"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover"
          >
            <Heart className="size-4" />
            Tạo tài khoản miễn phí
          </Link>
        </div>

        {/* Bài liên quan */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-lg font-bold text-po-text">Bài viết khác</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="rounded-2xl border border-po-border bg-white p-4 no-underline transition hover:border-po-primary hover:shadow-sm"
                >
                  <h3 className="text-sm font-bold leading-snug text-po-text">{p.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-po-text-muted">
                    {p.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <Footer />
    </main>
  )
}
