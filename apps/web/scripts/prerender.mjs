// Prerender các trang public sau khi `vite build`.
//
// Vì PetOmi là SPA (client-render), bot tìm kiếm phải tự chạy JS mới thấy nội dung.
// Script này dùng headless Chrome (puppeteer) để render trước từng route public và
// ghi ra file index.html tĩnh đầy đủ HTML + thẻ <meta>/<title>/JSON-LD. Người dùng
// vẫn nhận được SPA bình thường (React hydrate lại), còn bot đọc được nội dung ngay.
//
// Cách chạy: tự động qua `npm run build` (đã nối vào script "build").
// Yêu cầu: đã cài devDependency `puppeteer`.

import http from "node:http"
import { readFile, writeFile, mkdir, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, "../dist")
const PORT = 4188

// Danh sách route cần prerender (chỉ các trang public, KHÔNG prerender dashboard).
const ROUTES = ["/", "/for-clinics", "/login", "/register"]

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
}

// Server tĩnh tối giản phục vụ thư mục dist; mọi route không phải file đều trả index.html (SPA).
function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0])
      let filePath = path.join(DIST, urlPath)

      let isFile = false
      try {
        isFile = (await stat(filePath)).isFile()
      } catch {
        isFile = false
      }

      if (!isFile) {
        filePath = path.join(DIST, "index.html")
      }

      const ext = path.extname(filePath)
      const body = await readFile(filePath)
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end("Not found")
    }
  })
}

async function main() {
  if (!existsSync(path.join(DIST, "index.html"))) {
    console.error("[prerender] Chưa thấy dist/index.html. Hãy chạy `vite build` trước.")
    process.exit(1)
  }

  // Khởi tạo trình duyệt theo môi trường:
  // - Trên Vercel (serverless): dùng puppeteer-core + @sparticuz/chromium
  //   (Chromium nén sẵn, đã gói đủ thư viện hệ thống cho môi trường Vercel).
  // - Ở local: dùng puppeteer thường (tự tải Chromium đầy đủ).
  // Nếu không có gói nào, bỏ qua prerender mà không làm hỏng build.
  const isServerless = Boolean(process.env.VERCEL) || Boolean(process.env.AWS_REGION)

  let browser
  try {
    if (isServerless) {
      const chromium = (await import("@sparticuz/chromium")).default
      const puppeteer = (await import("puppeteer-core")).default
      // Tắt graphics mode để nhẹ và tránh lỗi GL trong môi trường build.
      chromium.setGraphicsMode = false
      browser = await puppeteer.launch({
        args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    } else {
      const puppeteer = (await import("puppeteer")).default
      browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    }
  } catch (err) {
    console.warn(
      "[prerender] Bỏ qua prerender: chưa cài đủ trình duyệt headless.\n" +
        "  - Vercel/serverless: cần 'puppeteer-core' + '@sparticuz/chromium'.\n" +
        "  - Local: cần 'puppeteer'.\n" +
        `  Chi tiết: ${err instanceof Error ? err.message : String(err)}`,
    )
    process.exit(0)
  }

  const server = createServer()
  await new Promise((resolve) => server.listen(PORT, resolve))
  console.log(`[prerender] Server tĩnh chạy tại http://localhost:${PORT}`)

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage()
      const url = `http://localhost:${PORT}${route}`
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })

      // Đợi React render xong nội dung vào #root.
      await page
        .waitForFunction(() => {
          const root = document.getElementById("root")
          return root && root.children.length > 0
        }, { timeout: 15000 })
        .catch(() => {})

      const html = await page.content()

      const outDir =
        route === "/" ? DIST : path.join(DIST, route.replace(/^\//, ""))
      await mkdir(outDir, { recursive: true })
      await writeFile(path.join(outDir, "index.html"), html, "utf8")
      console.log(`[prerender] ✓ ${route} -> ${path.relative(DIST, path.join(outDir, "index.html"))}`)
      await page.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  console.log("[prerender] Hoàn tất.")
}

main().catch((err) => {
  console.error("[prerender] Lỗi:", err)
  process.exit(1)
})
