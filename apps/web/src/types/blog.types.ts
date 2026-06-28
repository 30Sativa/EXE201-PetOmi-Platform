// Kiểu dữ liệu cho blog (cẩm nang chăm sóc thú cưng).
// Nội dung lưu dạng mảng block để render an toàn, không cần markdown parser.

export type BlogBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string }

export interface BlogPost {
  /** Định danh trên URL: /blog/<slug> */
  slug: string
  /** Tiêu đề bài (cũng dùng cho <title> và h1). */
  title: string
  /** Mô tả ngắn ~150-160 ký tự cho meta description và thẻ tóm tắt. */
  description: string
  /** Ngày đăng dạng ISO "YYYY-MM-DD" (dùng cho hiển thị + JSON-LD). */
  date: string
  /** Tác giả hiển thị. */
  author: string
  /** Thời gian đọc ước lượng (phút). */
  readingMinutes: number
  /** Nhãn chủ đề, vd "Chó", "Mèo", "Tiêm phòng". */
  tags: string[]
  /** Ảnh đại diện (path trong /public hoặc URL tuyệt đối). */
  cover: string
  /** Nội dung bài viết. */
  content: BlogBlock[]
}
