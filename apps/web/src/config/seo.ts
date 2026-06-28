// Cấu hình SEO dùng chung cho toàn site.
// Đổi SITE_URL ở đây nếu domain thay đổi.

export const SITE_URL = "https://www.petomi.cloud"
export const SITE_NAME = "PetOmi"

// Mô tả mặc định (dùng khi một trang không khai báo description riêng).
export const DEFAULT_DESCRIPTION =
  "PetOmi là nền tảng chăm sóc thú cưng với trợ lý AI: ghi nhận triệu chứng, lưu hồ sơ sức khỏe, đặt lịch khám và kết nối với phòng khám thú y đã được xác thực."

// Ảnh chia sẻ mạng xã hội mặc định (Open Graph / Twitter).
export const DEFAULT_OG_IMAGE = `${SITE_URL}/hero-pets-new.png`

export const DEFAULT_LOCALE = "vi_VN"

export const TWITTER_HANDLE = "@petomi"

// Ghép title của trang với tên thương hiệu.
export function buildTitle(pageTitle?: string): string {
  if (!pageTitle) return `${SITE_NAME} — Trợ lý AI chăm sóc sức khỏe thú cưng`
  return `${pageTitle} | ${SITE_NAME}`
}

// Tạo URL tuyệt đối cho canonical / OG từ một path tương đối.
export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path
  const clean = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${clean === "/" ? "" : clean}`
}
