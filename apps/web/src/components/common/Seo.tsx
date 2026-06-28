import {
  DEFAULT_DESCRIPTION,
  DEFAULT_LOCALE,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  TWITTER_HANDLE,
  absoluteUrl,
  buildTitle,
} from "@/config/seo"

export interface SeoProps {
  /** Tiêu đề trang (chưa kèm tên thương hiệu). Để trống sẽ dùng title mặc định. */
  title?: string
  /** Mô tả ~150-160 ký tự cho thẻ meta description và OG. */
  description?: string
  /** Path tương đối của trang, vd "/for-clinics". Dùng cho canonical + OG url. */
  path?: string
  /** Ảnh chia sẻ mạng xã hội (URL tuyệt đối hoặc path). */
  image?: string
  /** "website" (mặc định) hoặc "article". */
  type?: "website" | "article"
  /** Đặt true cho các trang không muốn Google lập chỉ mục (dashboard, auth...). */
  noindex?: boolean
  /** Structured data JSON-LD bổ sung (object hoặc mảng object). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Quản lý các thẻ <title>, <meta>, <link> cho từng trang.
 *
 * Tận dụng cơ chế hoist metadata sẵn có của React 19: các thẻ này được render
 * trong component nhưng React sẽ tự động đưa lên <head>. Không cần thư viện ngoài.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoProps) {
  const fullTitle = buildTitle(title)
  const canonical = absoluteUrl(path)
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE
  const robots = noindex ? "noindex, nofollow" : "index, follow"

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={DEFAULT_LOCALE} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured data */}
      {jsonLdArray.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
