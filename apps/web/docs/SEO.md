# SEO cho PetOmi (apps/web)

Tài liệu này mô tả phần SEO đã được thiết lập cho frontend PetOmi và các việc cần làm tiếp theo.

PetOmi là một **SPA (Vite + React 19)** deploy trên Vercel. SPA render bằng JavaScript phía client, nên cần thiết lập thêm để công cụ tìm kiếm và mạng xã hội đọc được nội dung. Toàn bộ cấu hình dùng domain **https://www.petomi.cloud**.

---

## 1. Những gì đã được thêm

### Component quản lý meta theo từng trang

- `src/components/common/Seo.tsx` — component đặt `<title>`, `<meta description>`, `robots`, `canonical`, Open Graph, Twitter Card và JSON-LD cho từng trang. Tận dụng cơ chế *hoist metadata* sẵn có của React 19 (các thẻ render trong component được React tự đưa lên `<head>`), nên **không cần thư viện ngoài** như react-helmet.
- `src/config/seo.ts` — cấu hình dùng chung: `SITE_URL`, tên thương hiệu, mô tả mặc định, ảnh chia sẻ, hàm tạo title/URL tuyệt đối. **Đổi domain ở đây nếu cần.**
- `src/config/structuredData.ts` — các schema JSON-LD: `Organization`, `WebSite`, `SoftwareApplication`, và hàm dựng `FAQPage` từ danh sách câu hỏi.

### Meta đã gắn vào từng trang

| Trang | Route | Index? | Ghi chú |
|---|---|---|---|
| Landing | `/` | ✅ | Title + description riêng; JSON-LD Organization/WebSite/Software/FAQ |
| Cho phòng khám | `/for-clinics` | ✅ | Title + description riêng |
| Đăng nhập | `/login` | ✅ | Meta theo mode |
| Đăng ký | `/register` | ✅ | Meta theo mode |
| Quên mật khẩu | `/forgot-password` | ⛔ noindex | |
| Dashboard (owner/clinic/admin) | `/dashboard/*` | ⛔ noindex | Đặt ở 3 layout, bao trùm mọi trang con |
| 404 | `*` | ⛔ noindex | |

### Tệp tĩnh

- `public/robots.txt` — cho phép index trang công khai, chặn `/dashboard` và các route luồng xác thực; khai báo sitemap.
- `public/sitemap.xml` — liệt kê 4 URL công khai với độ ưu tiên.

### index.html

Đã bổ sung `lang="vi"`, meta description mặc định, `theme-color`, Open Graph/Twitter mặc định, canonical và sửa favicon trỏ về `favicon.svg` (trước đây trỏ nhầm vào `image.png` 359 KB). Đây là phần fallback hiển thị khi React chưa kịp render.

### Prerender cho bot

- `scripts/prerender.mjs` — sau khi `vite build`, script dùng headless Chrome render trước các trang public và ghi HTML tĩnh đầy đủ vào `dist/`. Bot đọc được nội dung ngay; người dùng vẫn nhận SPA bình thường.
  - **Trên Vercel** (serverless): tự dùng `puppeteer-core` + `@sparticuz/chromium` (Chromium nén sẵn, đã gói đủ thư viện hệ thống — tránh lỗi `libnspr4.so` khi dùng puppeteer thường).
  - **Ở local**: dùng `puppeteer` thường (tự tải Chromium đầy đủ).
  - Script tự phát hiện môi trường qua biến `VERCEL`/`AWS_REGION`.
- Script trong `package.json`:
  - `npm run build` — build SPA như cũ (không đổi).
  - `npm run build:prerender` — build rồi prerender (cần `puppeteer`).
  - `npm run prerender` — chỉ chạy prerender trên `dist/` có sẵn.
- `puppeteer` đã được thêm vào `devDependencies`. Nếu chưa cài, script tự bỏ qua mà không làm hỏng build.

---

## 2. Cần làm tiếp (theo thứ tự ưu tiên)

1. **Cài dependency mới và build thử** trên máy (Windows):

   ```bash
   cd apps/web
   npm install
   npm run build          # kiểm tra SPA build sạch
   npm run build:prerender # nếu muốn bật prerender (sẽ tải Chromium lần đầu)
   ```

   > Lưu ý: phần thay đổi đã được kiểm tra ở mức cú pháp/cấu trúc, nhưng `npm run build` **chưa chạy được trong môi trường tạo bản vá này** (thiếu native binary của rolldown cho Linux). Hãy chạy build trên máy bạn để xác nhận xanh trước khi deploy.

2. **Bật prerender khi deploy Vercel** (đã chọn bật):
   - Vào project web trên Vercel → **Settings → Build & Development Settings → Build Command**, bật Override và đổi thành:

     ```
     npm run build:prerender
     ```

   - `vercel.json` đã được cấu hình `cleanUrls: true` và rewrite có loại trừ, để các trang đã prerender (`for-clinics`, `login`, `register`) và file tĩnh (`robots.txt`, `sitemap.xml`, ảnh) được phục vụ trực tiếp thay vì bị đẩy về `index.html`. Các route SPA còn lại (vd `/dashboard/...`) vẫn fallback về `index.html` như cũ.
   - Root Directory của project trên Vercel phải là `apps/web` (giữ nguyên như hiện tại).
   - Lần build đầu sẽ lâu hơn vì Vercel tải Chromium cho puppeteer.

3. **Google Search Console**: thêm property `https://www.petomi.cloud`, xác minh sở hữu, gửi `sitemap.xml`. Theo dõi phần Coverage và Enhancements (FAQ rich result).

4. **Ảnh OG riêng** (1200×630): hiện đang dùng `hero-pets-new.png`. Nên tạo một ảnh OG có logo + slogan để link chia sẻ trên Facebook/Zalo đẹp hơn, rồi cập nhật `DEFAULT_OG_IMAGE` trong `src/config/seo.ts`.

5. **Liên kết mạng xã hội**: điền mảng `sameAs` trong `organizationSchema` (`src/config/structuredData.ts`) khi có Facebook/Instagram/Zalo OA — giúp Google liên kết thương hiệu.

6. **Nội dung**: trang chủ tiếng Việt đã có heading rõ ràng. Cân nhắc thêm trang nội dung (blog/cẩm nang chăm sóc thú cưng) để có thêm từ khóa và backlink tự nhiên — đây là yếu tố tăng trưởng SEO dài hạn lớn nhất cho sản phẩm dạng này.

---

## 3. Cách dùng component Seo cho trang mới

```tsx
import Seo from "@/components/common/Seo"

export default function MyPage() {
  return (
    <main>
      <Seo
        title="Tiêu đề trang"          // sẽ thành "Tiêu đề trang | PetOmi"
        description="Mô tả 150-160 ký tự."
        path="/duong-dan"             // dùng cho canonical + OG url
        // noindex                    // bật cho trang không muốn Google index
        // jsonLd={[...]}             // structured data nếu có
      />
      {/* ... */}
    </main>
  )
}
```
