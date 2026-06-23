import {
  ChartNoAxesCombined,
  MessageCircle,
  MousePointerClick,
  Trophy,
  UserPlus,
} from "lucide-react"

import AdminPageHeader from "@/components/dashboard/AdminPageHeader"
import { cn } from "@/lib/utils"

/**
 * Dữ liệu A/B test CTA (DỮ LIỆU MẪU — sửa ở đây khi có số thật từ Google Analytics).
 *  - cta: "chat"   => CTA "Chat với AI ngay"   (Thứ 2 - Thứ 4)
 *  - cta: "signup" => CTA "Đăng ký ngay"        (Thứ 5 - Thứ 7)
 *  - impression: lượt tiếp cận (lấy từ thống kê bài viết trên Facebook/MXH)
 *  - click: lượt bấm vào web (lấy từ Google Analytics, lọc theo utm_content)
 * CTR sẽ được tự tính = click / impression.
 */
type CtaKey = "chat" | "signup"

interface DayRow {
  day: string
  cta: CtaKey
  label: string
  impression: number
  click: number
}

const DATA: DayRow[] = [
  { day: "Thứ 2", cta: "chat", label: "Chat với AI ngay", impression: 5200, click: 312 },
  { day: "Thứ 3", cta: "chat", label: "Chat với AI ngay", impression: 6100, click: 402 },
  { day: "Thứ 4", cta: "chat", label: "Chat với AI ngay", impression: 5800, click: 365 },
  { day: "Thứ 5", cta: "signup", label: "Đăng ký ngay", impression: 5600, click: 221 },
  { day: "Thứ 6", cta: "signup", label: "Đăng ký ngay", impression: 6400, click: 268 },
  { day: "Thứ 7", cta: "signup", label: "Đăng ký ngay", impression: 7100, click: 305 },
]

const nf = new Intl.NumberFormat("vi-VN")
const formatNumber = (value: number) => nf.format(value)
const formatPercent = (a: number, b: number) =>
  b === 0
    ? "0%"
    : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format((a / b) * 100)}%`

const sumBy = (rows: DayRow[], key: "impression" | "click") =>
  rows.reduce((acc, row) => acc + row[key], 0)

export default function AdminCtaReportPage() {
  const chatRows = DATA.filter((row) => row.cta === "chat")
  const signupRows = DATA.filter((row) => row.cta === "signup")

  const totalImpression = sumBy(DATA, "impression")
  const totalClick = sumBy(DATA, "click")

  const chatImpression = sumBy(chatRows, "impression")
  const chatClick = sumBy(chatRows, "click")
  const signupImpression = sumBy(signupRows, "impression")
  const signupClick = sumBy(signupRows, "click")

  const chatCtr = chatImpression === 0 ? 0 : chatClick / chatImpression
  const signupCtr = signupImpression === 0 ? 0 : signupClick / signupImpression

  const chatWins = chatCtr >= signupCtr
  const winnerLabel = chatWins ? "Chat với AI ngay" : "Đăng ký ngay"
  const loserCtr = chatWins ? signupCtr : chatCtr
  const winnerCtr = chatWins ? chatCtr : signupCtr
  const lift = loserCtr === 0 ? 0 : ((winnerCtr - loserCtr) / loserCtr) * 100

  const maxClick = Math.max(...DATA.map((row) => row.click), 1)

  return (
    <div className="grid gap-5 md:gap-6">
      <AdminPageHeader
        kicker="Marketing · A/B test"
        title="Báo cáo A/B Test CTA"
        description="So sánh hiệu quả 2 lời kêu gọi hành động trong tuần (Thứ 2 → Thứ 7) để chọn CTA tốt nhất."
        icon={ChartNoAxesCombined}
        metrics={[
          { label: "Tổng lượt tiếp cận", value: formatNumber(totalImpression), icon: MessageCircle },
          { label: "Tổng lượt click vào web", value: formatNumber(totalClick), icon: MousePointerClick },
          { label: "CTR trung bình", value: formatPercent(totalClick, totalImpression), icon: ChartNoAxesCombined },
        ]}
      />

      {/* KPI 2 CTA */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tiếp cận — Chat với AI"
          value={formatNumber(chatImpression)}
          hint="Thứ 2 · Thứ 3 · Thứ 4"
          icon={MessageCircle}
          tone="chat"
        />
        <MetricCard
          label="CTR — Chat với AI ngay"
          value={formatPercent(chatClick, chatImpression)}
          hint={`${formatNumber(chatClick)} lượt click vào web`}
          icon={MousePointerClick}
          tone="chat"
        />
        <MetricCard
          label="Tiếp cận — Đăng ký"
          value={formatNumber(signupImpression)}
          hint="Thứ 5 · Thứ 6 · Thứ 7"
          icon={UserPlus}
          tone="signup"
        />
        <MetricCard
          label="CTR — Đăng ký ngay"
          value={formatPercent(signupClick, signupImpression)}
          hint={`${formatNumber(signupClick)} lượt click vào web`}
          icon={MousePointerClick}
          tone="signup"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        {/* Biểu đồ cột theo ngày */}
        <section className="rounded-[28px] bg-white/92 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-po-text">Lượt click vào web theo ngày</p>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">
                Cột càng cao = càng nhiều người bấm vào web từ bài đăng hôm đó.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-po-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-po-primary" /> Chat với AI
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-sky-500" /> Đăng ký
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-3 sm:gap-5" style={{ height: 240 }}>
            {DATA.map((row) => {
              const heightPct = Math.max(6, Math.round((row.click / maxClick) * 100))
              return (
                <div key={row.day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-xs font-bold tabular-nums text-po-text">
                    {formatNumber(row.click)}
                  </span>
                  <div
                    className={cn(
                      "w-full max-w-[54px] rounded-t-xl transition-all",
                      row.cta === "chat" ? "bg-po-primary" : "bg-sky-500",
                    )}
                    style={{ height: `${heightPct}%` }}
                    title={`${row.label} · ${formatNumber(row.click)} click · CTR ${formatPercent(row.click, row.impression)}`}
                  />
                  <span className="text-xs font-semibold text-po-text-muted">{row.day}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Đối đầu + kết luận */}
        <section className="rounded-[28px] bg-white/92 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 md:p-6">
          <p className="text-sm font-semibold text-po-text">Đối đầu: CTA nào thắng?</p>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="rounded-2xl bg-po-primary-soft px-3 py-4 text-center ring-1 ring-po-border/60">
              <p className="text-xs font-semibold text-po-text-muted">Chat với AI ngay</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-po-primary">
                {formatNumber(chatClick)}
              </p>
              <p className="mt-0.5 text-[11px] text-po-text-muted">tổng lượt click</p>
            </div>
            <span className="text-sm font-extrabold text-po-text-subtle">VS</span>
            <div className="rounded-2xl bg-sky-50 px-3 py-4 text-center ring-1 ring-po-border/60">
              <p className="text-xs font-semibold text-po-text-muted">Đăng ký ngay</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-sky-600">
                {formatNumber(signupClick)}
              </p>
              <p className="mt-0.5 text-[11px] text-po-text-muted">tổng lượt click</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-po-success-soft px-4 py-3 ring-1 ring-po-border/50">
            <Trophy className="mt-0.5 size-5 shrink-0 text-po-success" />
            <p className="text-sm leading-6 text-po-text">
              CTA <strong>“{winnerLabel}”</strong> hiệu quả hơn — tỉ lệ click (CTR) cao hơn khoảng{" "}
              <strong>
                {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(lift)}%
              </strong>
              . Nên ưu tiên dùng CTA này cho các bài đăng tiếp theo.
            </p>
          </div>
        </section>
      </div>

      {/* Bảng chi tiết */}
      <section className="overflow-hidden rounded-[28px] bg-white/92 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="px-5 pt-5 md:px-6">
          <p className="text-sm font-semibold text-po-text">Chi tiết theo từng ngày</p>
          <p className="mt-1 text-xs leading-5 text-po-text-muted">
            Dữ liệu mẫu — thay bằng số thật từ Google Analytics khi chạy chiến dịch.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-y border-po-border/70 bg-po-surface-muted/50 text-[11px] uppercase tracking-[0.04em] text-po-text-subtle">
                <th className="px-5 py-3 text-left font-semibold md:px-6">Ngày</th>
                <th className="px-3 py-3 text-left font-semibold">CTA</th>
                <th className="px-3 py-3 text-right font-semibold">Tiếp cận</th>
                <th className="px-3 py-3 text-right font-semibold">Click vào web</th>
                <th className="px-5 py-3 text-right font-semibold md:px-6">CTR</th>
              </tr>
            </thead>
            <tbody>
              {DATA.map((row) => (
                <tr key={row.day} className="border-b border-po-border/50 last:border-b-0">
                  <td className="px-5 py-3 font-semibold text-po-text md:px-6">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          row.cta === "chat" ? "bg-po-primary" : "bg-sky-500",
                        )}
                      />
                      {row.day}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        row.cta === "chat"
                          ? "bg-po-primary-soft text-po-primary"
                          : "bg-sky-50 text-sky-600",
                      )}
                    >
                      {row.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-po-text-muted">
                    {formatNumber(row.impression)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-po-text">
                    {formatNumber(row.click)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-po-text md:px-6">
                    {formatPercent(row.click, row.impression)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-po-border bg-po-surface-muted/40 font-bold text-po-text">
                <td className="px-5 py-3 md:px-6">Tổng</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(totalImpression)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(totalClick)}</td>
                <td className="px-5 py-3 text-right tabular-nums md:px-6">
                  {formatPercent(totalClick, totalImpression)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof MessageCircle
  tone: CtaKey
}) {
  const toneClass =
    tone === "chat"
      ? { bg: "bg-po-primary-soft", text: "text-po-primary" }
      : { bg: "bg-sky-50", text: "text-sky-600" }

  return (
    <div className="rounded-[22px] bg-white/90 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold leading-5 text-po-text">{label}</p>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", toneClass.bg, toneClass.text)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className={cn("mt-5 text-3xl font-extrabold leading-none tabular-nums", toneClass.text)}>
        {value}
      </p>
      {hint ? <p className="mt-3 text-xs font-medium leading-5 text-po-text-muted">{hint}</p> : null}
    </div>
  )
}
