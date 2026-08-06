import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  BellRing,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MessageCircleMore,
  PawPrint,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  Zap,
} from "lucide-react"
import type { ElementType } from "react"

import Seo from "@/components/common/Seo"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { cn } from "@/lib/utils"
import { getAdminUserBehaviorApi } from "@/services/admin.service"
import type {
  AdminBehaviorInsightItem,
  AdminFeatureAdoptionItem,
  AdminUserBehaviorItem,
} from "@/types"

type DataOrigin = "all" | "real" | "synthetic"
type Preset = "7" | "30" | "90" | "july"

const numberFormatter = new Intl.NumberFormat("vi-VN")
const percentFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 })

const segmentStyles: Record<string, string> = {
  champion: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  returning: "bg-sky-50 text-sky-700 ring-sky-200",
  activated: "bg-violet-50 text-violet-700 ring-violet-200",
  exploring: "bg-amber-50 text-amber-700 ring-amber-200",
  dormant: "bg-slate-100 text-slate-600 ring-slate-200",
}

const featureIcons: Record<string, ElementType> = {
  pet: PawPrint,
  chat: Bot,
  medical: Stethoscope,
  reminder: BellRing,
}

function toInputDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(value: Date, amount: number) {
  const result = new Date(value)
  result.setDate(result.getDate() + amount)
  return result
}

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })
}

function formatDateTime(value: string | null) {
  if (!value) return "Chưa hoạt động"
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatMinutes(value: number) {
  if (value < 60) return `${percentFormatter.format(value)} phút`
  const hours = Math.floor(value / 60)
  const minutes = Math.round(value % 60)
  return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`
}

function initials(user: AdminUserBehaviorItem) {
  const source = user.fullName?.trim() || user.email
  return source
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("")
}

function chatInitials(fullName: string | null, email: string) {
  return (fullName?.trim() || email)
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("")
}

export default function AdminUserBehaviorPage() {
  const today = useMemo(() => new Date(), [])
  const [preset, setPreset] = useState<Preset>("30")
  const [fromDate, setFromDate] = useState(toInputDate(addDays(today, -29)))
  const [toDate, setToDate] = useState(toInputDate(today))
  const [origin, setOrigin] = useState<DataOrigin>("all")
  const [search, setSearch] = useState("")
  const [segment, setSegment] = useState("all")

  const query = useQuery({
    queryKey: ["admin", "user-behavior", fromDate, toDate, origin],
    queryFn: () => getAdminUserBehaviorApi({ fromDate, toDate, origin }),
    staleTime: 60 * 1000,
  })

  const applyPreset = (value: Preset) => {
    setPreset(value)
    if (value === "july") {
      setFromDate("2026-07-01")
      setToDate("2026-07-31")
      return
    }

    const days = Number(value)
    setFromDate(toInputDate(addDays(today, -(days - 1))))
    setToDate(toInputDate(today))
  }

  const users = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi")
    return (query.data?.users ?? []).filter((user) => {
      const matchesSegment = segment === "all" || user.segment === segment
      const matchesSearch =
        !keyword ||
        user.email.toLocaleLowerCase("vi").includes(keyword) ||
        user.fullName?.toLocaleLowerCase("vi").includes(keyword) ||
        user.petNames.some((pet) => pet.toLocaleLowerCase("vi").includes(keyword))
      return matchesSegment && Boolean(matchesSearch)
    })
  }, [query.data?.users, search, segment])

  const data = query.data
  const summary = data?.summary
  const maxDailyValue = Math.max(
    ...(data?.dailyActivity.map((item) => Math.max(item.activeUsers, item.conversations)) ?? [1]),
    1,
  )
  const maxFunnelUsers = Math.max(data?.funnel[0]?.users ?? 0, 1)
  const dayLabelStep = Math.max(1, Math.ceil((data?.dailyActivity.length ?? 1) / 10))

  return (
    <div className="grid gap-5 md:gap-6">
      <Seo title="Phân tích hành vi người dùng" noindex />

      <section className="relative overflow-hidden rounded-[32px] bg-[#14372f] px-5 py-6 text-white shadow-xl shadow-emerald-950/10 md:px-7 md:py-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#f49a62]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(440px,0.85fr)] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-emerald-50 ring-1 ring-white/15">
              <Activity className="size-3.5 text-[#ffad78]" />
              Product intelligence
            </div>
            <h2 className="mt-5 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-[-0.02em] md:text-4xl">
              Hiểu người dùng đang làm gì,
              <span className="text-[#ffad78]"> biết sản phẩm cần đổi ở đâu.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-emerald-50/75 md:text-base">
              Theo dõi hành trình từ tạo tài khoản đến tạo pet, sử dụng dịch vụ và quay lại. Các tín hiệu bên dưới được tạo trực tiếp từ hành vi trong hệ thống.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <HeroMetric
              label="Người dùng hoạt động"
              value={summary ? formatNumber(summary.activeUsers) : "—"}
              detail={summary ? `${formatPercent(summary.engagementRate)} tổng tài khoản` : "Đang tải dữ liệu"}
              icon={UsersRound}
            />
            <HeroMetric
              label="Đã kích hoạt"
              value={summary ? formatNumber(summary.activatedUsers) : "—"}
              detail={summary ? `${formatPercent(summary.activationRate)} đạt giá trị cốt lõi` : "Đang tải dữ liệu"}
              icon={Target}
            />
            <HeroMetric
              label="Quay lại sử dụng"
              value={summary ? formatPercent(summary.returnRate) : "—"}
              detail={summary ? `${formatNumber(summary.returningUsers)} người dùng` : "Đang tải dữ liệu"}
              icon={TrendingUp}
            />
            <HeroMetric
              label="DAU trung bình"
              value={summary ? percentFormatter.format(summary.averageDailyActiveUsers) : "—"}
              detail="Người dùng hoạt động / ngày"
              icon={Zap}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-po-text-subtle">Khoảng phân tích</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                ["7", "7 ngày"],
                ["30", "30 ngày"],
                ["90", "90 ngày"],
                ["july", "Tháng 7/2026"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => applyPreset(value)}
                  className={cn(
                    "h-9 rounded-xl px-3.5 text-xs font-bold transition",
                    preset === value
                      ? "bg-po-primary text-white shadow-sm shadow-orange-200/50"
                      : "bg-po-surface-muted text-po-text-muted hover:text-po-text",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-end">
            <label className="grid gap-1.5 text-xs font-bold text-po-text-muted">
              Từ ngày
              <span className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
                <input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(event) => {
                    setFromDate(event.target.value)
                    setPreset("30")
                  }}
                  className="h-11 w-full rounded-xl bg-po-surface-muted pl-9 pr-3 text-sm font-semibold text-po-text outline-none ring-1 ring-po-border transition focus:ring-2 focus:ring-po-primary/35"
                />
              </span>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-po-text-muted">
              Đến ngày
              <span className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(event) => {
                    setToDate(event.target.value)
                    setPreset("30")
                  }}
                  className="h-11 w-full rounded-xl bg-po-surface-muted pl-9 pr-3 text-sm font-semibold text-po-text outline-none ring-1 ring-po-border transition focus:ring-2 focus:ring-po-primary/35"
                />
              </span>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-po-text-muted sm:col-span-2 xl:min-w-48">
              Phạm vi tài khoản
              <select
                value={origin}
                onChange={(event) => setOrigin(event.target.value as DataOrigin)}
                className="h-11 rounded-xl bg-po-surface-muted px-3 text-sm font-semibold text-po-text outline-none ring-1 ring-po-border transition focus:ring-2 focus:ring-po-primary/35"
              >
                <option value="all">Toàn bộ tài khoản</option>
                <option value="real">Tài khoản thường</option>
                <option value="synthetic">Dữ liệu demo</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173b33] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0f2f28] disabled:cursor-wait disabled:opacity-70 sm:col-span-2 xl:col-span-1"
            >
              <RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />
              Làm mới
            </button>
          </div>
        </div>
      </section>

      {query.isLoading ? (
        <section className="grid min-h-80 place-items-center rounded-[28px] bg-white ring-1 ring-po-border/80">
          <div className="grid justify-items-center gap-3 text-sm font-semibold text-po-text-muted">
            <LoadingSpinner />
            Đang tổng hợp hành vi người dùng…
          </div>
        </section>
      ) : query.isError || !data || !summary ? (
        <section className="grid min-h-80 place-items-center rounded-[28px] bg-white p-6 text-center ring-1 ring-red-200">
          <div>
            <p className="text-lg font-extrabold text-po-text">Chưa tải được dữ liệu hành vi</p>
            <p className="mt-2 text-sm text-po-text-muted">Kiểm tra API và kết nối database, sau đó thử làm mới.</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-5 rounded-xl bg-po-primary px-4 py-2.5 text-sm font-bold text-white"
            >
              Thử lại
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Tài khoản mới"
              value={formatNumber(summary.newUsers)}
              detail={`${formatNumber(summary.usersInDataset)} tài khoản trong tập dữ liệu`}
              icon={UserRoundCheck}
              tone="orange"
            />
            <MetricCard
              label="Phiên sử dụng"
              value={formatNumber(summary.totalSessions)}
              detail={`Trung bình ${formatMinutes(summary.averageSessionMinutes)} / phiên`}
              icon={Clock3}
              tone="green"
            />
            <MetricCard
              label="Hội thoại AI"
              value={formatNumber(summary.conversations)}
              detail={`${formatNumber(summary.ownerMessages)} tin nhắn từ người dùng`}
              icon={MessageCircleMore}
              tone="violet"
            />
            <MetricCard
              label="Hành động chăm sóc"
              value={formatNumber(summary.medicalNotes + summary.remindersCreated)}
              detail={`${formatNumber(summary.medicalNotes)} ghi chú · ${formatNumber(summary.remindersCreated)} nhắc lịch`}
              icon={Stethoscope}
              tone="blue"
            />
          </section>

          <Panel
            title="Người dùng đang hỏi gì?"
            subtitle="Tổng hợp trực tiếp từ câu hỏi gửi cho AI trong khoảng thời gian đã chọn."
            icon={MessageCircleMore}
            action={
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-200">
                {formatNumber(data.chatAnalytics.totalQuestions)} câu hỏi
              </span>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ChatSummaryChip label="Người đã chat" value={formatNumber(data.chatAnalytics.uniqueChatUsers)} detail="Tài khoản có gửi câu hỏi" />
              <ChatSummaryChip label="Câu hỏi / người" value={percentFormatter.format(data.chatAnalytics.questionsPerChatUser)} detail="Mức sử dụng trung bình" />
              <ChatSummaryChip label="Câu hỏi / hội thoại" value={percentFormatter.format(data.chatAnalytics.questionsPerConversation)} detail="Độ sâu hội thoại" />
              <ChatSummaryChip label="AI phản hồi" value={formatNumber(summary.aiResponses)} detail={`${formatNumber(summary.conversations)} hội thoại`} />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(360px,1.2fr)_minmax(260px,0.75fr)]">
              <div className="rounded-[22px] bg-po-surface-muted/65 p-4 ring-1 ring-po-border/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-po-text">Top chủ đề</h4>
                    <p className="mt-1 text-[11px] text-po-text-muted">Phân loại theo intent của câu hỏi</p>
                  </div>
                  <Bot className="size-4 text-po-primary" />
                </div>
                <div className="mt-4 grid gap-3">
                  {data.chatAnalytics.topTopics.length === 0 ? (
                    <SmallEmpty label="Chưa có chủ đề chat trong kỳ." />
                  ) : data.chatAnalytics.topTopics.slice(0, 6).map((topic, index) => (
                    <div key={topic.intent}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-2 font-bold text-po-text">
                          <i className={cn("size-2 shrink-0 rounded-full", index === 0 ? "bg-po-primary" : index === 1 ? "bg-emerald-600" : "bg-amber-400")} />
                          <span className="truncate">{topic.label}</span>
                        </span>
                        <span className="shrink-0 font-extrabold text-po-text">{formatNumber(topic.questions)}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-po-primary" style={{ width: `${Math.max(3, topic.percentage)}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-po-text-subtle">{formatPercent(topic.percentage)} · {topic.users} người hỏi</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] bg-white p-4 ring-1 ring-po-border/80">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-po-text">Câu hỏi thường gặp / gần đây</h4>
                    <p className="mt-1 text-[11px] text-po-text-muted">Câu giống nhau được gom lại và đếm số lần hỏi</p>
                  </div>
                  <Sparkles className="size-4 text-violet-600" />
                </div>
                <div className="mt-4 grid gap-2.5">
                  {data.chatAnalytics.topQuestions.length === 0 ? (
                    <SmallEmpty label="Chưa có câu hỏi để tổng hợp." />
                  ) : data.chatAnalytics.topQuestions.slice(0, 6).map((question, index) => (
                    <article key={`${question.question}-${index}`} className="rounded-2xl bg-po-surface-muted/65 p-3 ring-1 ring-po-border/60">
                      <div className="flex items-start gap-2.5">
                        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-extrabold text-po-primary ring-1 ring-po-border">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-5 text-po-text">{question.question}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-extrabold uppercase tracking-wide">
                            <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700 ring-1 ring-violet-200">{question.intentLabel}</span>
                            <span className="text-po-text-subtle">{question.askCount} lượt hỏi · {question.users} người</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] bg-[#173b33] p-4 text-white ring-1 ring-[#173b33]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold">Người hỏi nhiều nhất</h4>
                    <p className="mt-1 text-[11px] text-emerald-50/60">Xếp theo số câu hỏi</p>
                  </div>
                  <UsersRound className="size-4 text-[#ffad78]" />
                </div>
                <div className="mt-4 grid gap-2">
                  {data.chatAnalytics.topUsers.length === 0 ? (
                    <p className="rounded-2xl bg-white/8 p-4 text-center text-xs text-emerald-50/60">Chưa có người dùng chat.</p>
                  ) : data.chatAnalytics.topUsers.map((user, index) => (
                    <div key={user.userId} className="flex items-center gap-3 rounded-2xl bg-white/7 p-2.5 ring-1 ring-white/8">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/12 text-[10px] font-extrabold">{chatInitials(user.fullName, user.email)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold">{user.fullName || user.email}</p>
                        <p className="mt-0.5 truncate text-[10px] text-emerald-50/55">{user.conversations} hội thoại · {user.activeDays} ngày</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold text-[#ffad78]">{formatNumber(user.questions)}</p>
                        <p className="text-[8px] font-bold uppercase tracking-wide text-emerald-50/45">#{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
            <Panel
              title="Nhịp độ sử dụng"
              subtitle={`Người dùng hoạt động và hội thoại từ ${formatDate(data.fromDate)} đến ${formatDate(data.toDate)}.`}
              icon={BarChart3}
              action={
                <div className="flex items-center gap-4 text-[11px] font-bold text-po-text-muted">
                  <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-po-primary" /> Active users</span>
                  <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-emerald-700" /> Hội thoại</span>
                </div>
              }
            >
              <div className="overflow-x-auto pb-2">
                <div
                  className="flex h-64 items-end gap-2 pt-8"
                  style={{ minWidth: `${Math.max(680, data.dailyActivity.length * 30)}px` }}
                >
                  {data.dailyActivity.map((day, index) => {
                    const activeHeight = Math.max(4, (day.activeUsers / maxDailyValue) * 180)
                    const conversationHeight = Math.max(3, (day.conversations / maxDailyValue) * 180)
                    const showLabel = index % dayLabelStep === 0 || index === data.dailyActivity.length - 1
                    return (
                      <div key={day.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                        <div className="relative flex h-[180px] w-full items-end justify-center gap-1">
                          <div
                            className="w-[42%] max-w-4 rounded-t-md bg-po-primary transition group-hover:bg-po-primary-hover"
                            style={{ height: `${activeHeight}px` }}
                            title={`${formatDate(day.date)}: ${day.activeUsers} người dùng hoạt động`}
                          />
                          <div
                            className="w-[42%] max-w-4 rounded-t-md bg-emerald-700/80 transition group-hover:bg-emerald-700"
                            style={{ height: `${conversationHeight}px` }}
                            title={`${formatDate(day.date)}: ${day.conversations} hội thoại`}
                          />
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-44 -translate-x-1/2 rounded-xl bg-[#102e27] p-3 text-[11px] text-white shadow-xl group-hover:block">
                            <p className="font-extrabold">{formatDate(day.date)}</p>
                            <p className="mt-1 text-emerald-50/75">{day.activeUsers} active · {day.sessions} phiên</p>
                            <p className="text-emerald-50/75">{day.conversations} hội thoại · {day.ownerMessages} tin nhắn</p>
                          </div>
                        </div>
                        <span className="h-4 text-[10px] font-semibold text-po-text-subtle">
                          {showLabel ? formatDate(day.date) : ""}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Panel>

            <Panel
              title="Tín hiệu cần ưu tiên"
              subtitle="Gợi ý hành động dựa trên số liệu hiện tại."
              icon={Lightbulb}
            >
              <div className="grid gap-3">
                {data.insights.slice(0, 3).map((insight) => (
                  <InsightCard key={`${insight.title}-${insight.metric}`} insight={insight} />
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
            <Panel
              title="Funnel kích hoạt"
              subtitle="Điểm rơi người dùng qua từng bước tạo giá trị."
              icon={Target}
            >
              <div className="grid gap-4">
                {data.funnel.map((step, index) => {
                  const width = Math.max(8, (step.users / maxFunnelUsers) * 100)
                  return (
                    <div key={step.key}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-lg bg-po-primary-soft text-[11px] font-extrabold text-po-primary">{index + 1}</span>
                            <p className="text-sm font-extrabold text-po-text">{step.label}</p>
                          </div>
                          <p className="mt-1.5 pl-8 text-xs leading-5 text-po-text-muted">{step.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-extrabold text-po-text">{formatNumber(step.users)}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-po-text-subtle">{formatPercent(step.conversionRate)}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-po-surface-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-po-primary to-[#ffb17e] transition-all"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      {index > 0 && step.dropOffUsers > 0 && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <ArrowDownRight className="size-3" /> Rơi {formatNumber(step.dropOffUsers)} người từ bước trước
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Panel>

            <Panel
              title="Mức độ sử dụng tính năng"
              subtitle="Adoption theo người dùng hoạt động và tổng lượt thao tác."
              icon={Sparkles}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {data.featureAdoption.map((feature) => (
                  <FeatureCard key={feature.key} feature={feature} />
                ))}
              </div>
            </Panel>
          </section>

          <Panel
            title="Phân khúc người dùng"
            subtitle="Nhìn nhanh quy mô từng nhóm để chọn đúng cách kích hoạt và giữ chân."
            icon={UsersRound}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {data.segments.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setSegment(item.key === segment ? "all" : item.key)}
                  className={cn(
                    "rounded-[22px] p-4 text-left ring-1 transition hover:-translate-y-0.5 hover:shadow-md",
                    segment === item.key ? "bg-[#173b33] text-white ring-[#173b33]" : "bg-po-surface-muted/65 text-po-text ring-po-border/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-extrabold">{item.label}</p>
                    <span className={cn("rounded-full px-2 py-1 text-[10px] font-extrabold", segment === item.key ? "bg-white/15" : "bg-white text-po-text-muted")}>{formatPercent(item.percentage)}</span>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold">{formatNumber(item.users)}</p>
                  <p className={cn("mt-2 text-xs leading-5", segment === item.key ? "text-emerald-50/70" : "text-po-text-muted")}>{item.description}</p>
                </button>
              ))}
            </div>
          </Panel>

          <section className="overflow-hidden rounded-[28px] bg-white shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
            <div className="flex flex-col gap-4 border-b border-po-border/70 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-po-primary-soft text-po-primary"><Activity className="size-4" /></span>
                  <div>
                    <h3 className="text-base font-extrabold text-po-text">Chi tiết hành vi từng người dùng</h3>
                    <p className="mt-0.5 text-xs text-po-text-muted">{formatNumber(users.length)} tài khoản phù hợp bộ lọc</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tên, email hoặc tên pet…"
                    className="h-10 w-full rounded-xl bg-po-surface-muted pl-9 pr-3 text-sm font-medium outline-none ring-1 ring-po-border focus:ring-2 focus:ring-po-primary/30"
                  />
                </label>
                <select
                  value={segment}
                  onChange={(event) => setSegment(event.target.value)}
                  className="h-10 rounded-xl bg-po-surface-muted px-3 text-sm font-semibold text-po-text outline-none ring-1 ring-po-border focus:ring-2 focus:ring-po-primary/30"
                >
                  <option value="all">Tất cả phân khúc</option>
                  {data.segments.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] border-collapse text-left">
                <thead>
                  <tr className="bg-po-surface-muted/70 text-[10px] font-extrabold uppercase tracking-[0.1em] text-po-text-subtle">
                    <th className="px-5 py-3.5">Người dùng</th>
                    <th className="px-4 py-3.5">Phân khúc</th>
                    <th className="px-4 py-3.5">Mức sử dụng</th>
                    <th className="px-4 py-3.5">Tính năng</th>
                    <th className="px-4 py-3.5">Điểm gắn kết</th>
                    <th className="px-5 py-3.5">Hoạt động gần nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-po-border/65">
                  {users.map((user) => (
                    <tr key={user.userId} className="transition hover:bg-orange-50/35">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#173b33] text-xs font-extrabold text-white">{initials(user)}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="max-w-52 truncate text-sm font-extrabold text-po-text">{user.fullName || "Chưa cập nhật tên"}</p>
                              {user.isSynthetic && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-violet-700 ring-1 ring-violet-200">Demo</span>}
                            </div>
                            <p className="mt-0.5 max-w-64 truncate text-xs text-po-text-muted">{user.email}</p>
                            <p className="mt-1 text-[10px] font-semibold text-po-text-subtle">{user.petNames.length ? `Pet: ${user.petNames.join(", ")}` : "Chưa có pet"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1", segmentStyles[user.segment] ?? segmentStyles.dormant)}>{user.segmentLabel}</span>
                        <p className="mt-2 text-[11px] font-semibold text-po-text-muted">{user.activeDays} ngày hoạt động</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-extrabold text-po-text">{formatNumber(user.totalActions)} hành động</p>
                        <p className="mt-1 text-[11px] text-po-text-muted">{user.sessions} phiên · {user.conversations} hội thoại</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <FeatureDot active={user.hasPet} label="Pet" icon={PawPrint} />
                          <FeatureDot active={user.ownerMessages > 0} label="AI" icon={Bot} />
                          <FeatureDot active={user.medicalNotes > 0} label="Ghi chú" icon={Stethoscope} />
                          <FeatureDot active={user.remindersCreated > 0} label="Nhắc lịch" icon={BellRing} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-po-surface-muted">
                            <div className={cn("h-full rounded-full", user.engagementScore >= 70 ? "bg-emerald-600" : user.engagementScore >= 40 ? "bg-po-primary" : "bg-amber-400")} style={{ width: `${user.engagementScore}%` }} />
                          </div>
                          <span className="text-sm font-extrabold text-po-text">{user.engagementScore}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-po-text">{formatDateTime(user.lastActivityAt)}</p>
                        <p className="mt-1 text-[10px] font-semibold text-po-text-subtle">{user.isReturning ? "Đã quay lại" : user.totalActions > 0 ? "Mới hoạt động 1 ngày" : "Cần kích hoạt"}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="grid min-h-44 place-items-center p-6 text-center">
                <div>
                  <Search className="mx-auto size-8 text-po-text-subtle" />
                  <p className="mt-3 text-sm font-extrabold text-po-text">Không tìm thấy người dùng phù hợp</p>
                  <p className="mt-1 text-xs text-po-text-muted">Thử đổi từ khóa hoặc chọn lại phân khúc.</p>
                </div>
              </div>
            )}
          </section>

          <p className="px-1 text-right text-[11px] font-medium text-po-text-subtle">
            Cập nhật lúc {new Date(data.generatedAt).toLocaleString("vi-VN")} · {data.datasetLabel}
          </p>
        </>
      )}
    </div>
  )
}

function HeroMetric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: ElementType }) {
  return (
    <div className="rounded-[22px] bg-white/9 p-4 ring-1 ring-white/12 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-50/65">{label}</p>
        <Icon className="size-4 text-[#ffad78]" />
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-emerald-50/60">{detail}</p>
    </div>
  )
}

function ChatSummaryChip({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[18px] bg-po-surface-muted/60 p-4 ring-1 ring-po-border/65">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-po-text-subtle">{label}</p>
      <p className="mt-2 text-xl font-extrabold text-po-text">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-po-text-muted">{detail}</p>
    </div>
  )
}

function SmallEmpty({ label }: { label: string }) {
  return <p className="rounded-2xl bg-white/75 p-4 text-center text-xs font-semibold text-po-text-muted ring-1 ring-po-border/60">{label}</p>
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: ElementType; tone: "orange" | "green" | "violet" | "blue" }) {
  const tones = {
    orange: "bg-orange-50 text-po-primary ring-orange-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
  }
  return (
    <article className="rounded-[24px] bg-white p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-po-text-muted">{label}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-po-text">{value}</p>
          <p className="mt-1.5 text-[11px] font-medium leading-5 text-po-text-subtle">{detail}</p>
        </div>
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl ring-1", tones[tone])}><Icon className="size-5" /></span>
      </div>
    </article>
  )
}

function Panel({ title, subtitle, icon: Icon, action, children }: { title: string; subtitle: string; icon: ElementType; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary ring-1 ring-orange-100"><Icon className="size-4.5" /></span>
          <div>
            <h3 className="text-base font-extrabold text-po-text">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-po-text-muted">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function InsightCard({ insight }: { insight: AdminBehaviorInsightItem }) {
  const style = insight.severity === "positive"
    ? { shell: "bg-emerald-50/75 ring-emerald-100", icon: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 }
    : insight.severity === "warning"
      ? { shell: "bg-amber-50/80 ring-amber-100", icon: "bg-amber-100 text-amber-700", Icon: TrendingUp }
      : { shell: "bg-violet-50/75 ring-violet-100", icon: "bg-violet-100 text-violet-700", Icon: Sparkles }
  return (
    <article className={cn("rounded-[20px] p-4 ring-1", style.shell)}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", style.icon)}><style.Icon className="size-4" /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="text-sm font-extrabold leading-5 text-po-text">{insight.title}</h4>
            <span className="rounded-full bg-white/80 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-po-text-muted">{insight.metric}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-po-text-muted">{insight.description}</p>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] font-bold leading-5 text-po-text"><ArrowRight className="mt-0.5 size-3.5 shrink-0 text-po-primary" />{insight.recommendedAction}</p>
        </div>
      </div>
    </article>
  )
}

function FeatureCard({ feature }: { feature: AdminFeatureAdoptionItem }) {
  const Icon = featureIcons[feature.key] ?? Activity
  return (
    <article className="rounded-[22px] bg-po-surface-muted/65 p-4 ring-1 ring-po-border/65">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-10 place-items-center rounded-2xl bg-white text-po-primary shadow-sm ring-1 ring-po-border/70"><Icon className="size-4.5" /></span>
        <div className="text-right">
          <p className="text-xl font-extrabold text-po-text">{formatPercent(feature.adoptionRate)}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-po-text-subtle">adoption</p>
        </div>
      </div>
      <h4 className="mt-4 text-sm font-extrabold text-po-text">{feature.label}</h4>
      <p className="mt-1 text-xs leading-5 text-po-text-muted">{feature.description}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-po-primary" style={{ width: `${Math.min(100, feature.adoptionRate)}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-po-text-muted">
        <span>{formatNumber(feature.users)} người dùng</span>
        <span>{formatNumber(feature.events)} lượt</span>
      </div>
    </article>
  )
}

function FeatureDot({ active, label, icon: Icon }: { active: boolean; label: string; icon: ElementType }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-extrabold ring-1", active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-400 ring-slate-200")}>
      <Icon className="size-3" />{label}
    </span>
  )
}
