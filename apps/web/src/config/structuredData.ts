import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/config/seo"
import type { BlogPost } from "@/types"

// Tổ chức — hiển thị trong Knowledge Panel của Google nếu đủ tín hiệu.
export const organizationSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/image.png"),
  description: DEFAULT_DESCRIPTION,
  sameAs: [] as string[], // Thêm link mạng xã hội (Facebook, Instagram...) khi có.
}

// Trang web + ô tìm kiếm (sitelinks searchbox).
export const websiteSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "vi-VN",
}

// Mô tả phần mềm/ứng dụng — phù hợp cho sản phẩm SaaS như PetOmi.
export const softwareSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "VND",
  },
}

// Tạo FAQPage schema từ danh sách câu hỏi của trang landing.
export function buildFaqSchema(
  faqs: { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  }
}

// Bài viết blog — giúp Google hiểu đây là nội dung bài viết, đủ điều kiện hiển thị
// dạng article trong kết quả tìm kiếm.
export function buildArticleSchema(post: BlogPost): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: absoluteUrl(post.cover),
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "vi-VN",
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/image.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
  }
}

// Trang danh sách blog (Blog schema với danh sách bài).
export function buildBlogSchema(posts: BlogPost[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} — Cẩm nang chăm sóc thú cưng`,
    url: absoluteUrl("/blog"),
    inLanguage: "vi-VN",
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      url: absoluteUrl(`/blog/${post.slug}`),
    })),
  }
}
