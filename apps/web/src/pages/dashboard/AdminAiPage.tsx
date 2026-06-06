import {
  AlertCircle,
  Bell,
  Bot,
  Database,
  FileText,
  Gauge,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import type { ElementType } from "react"
import { useQuery } from "@tanstack/react-query"

import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { cn } from "@/lib/utils"
import { getAdminAlertsApi, getAdminDashboardApi } from "@/services/admin.service"

type Tone = "primary" | "success" | "warning" | "danger" | "muted"

const toneClasses: Record<Tone, { text: string; bg: string }> = {
  primary: { text: "text-po-primary", bg: "bg-po-primary-soft" },
  success: { text: "text-po-success", bg: "bg-po-success-soft" },
  warning: { text: "text-po-warning", bg: "bg-po-warning-soft" },
  danger: { text: "text-po-danger", bg: "bg-po-danger-soft" },
  muted: { text: "text-po-text-muted", bg: "bg-po-surface-muted" },
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

function formatPercent(value?: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(value ?? 0)}%`
}

export default function AdminAiPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["admin", "dashboard", "ai"],
    queryFn: getAdminDashboardApi,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["admin", "alerts", "ai"],
    queryFn: () => getAdminAlertsApi({ maxItems: 25 }),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const aiStats = dashboard?.aiStats
  const intentStats = dashboard?.aiIntentStats ?? []
  const systemAlerts = (alertsData?.items ?? []).filter((alert) => alert.type === "system")
  const maxIntentCount = Math.max(...intentStats.map((item) => item.count), 1)

  return (
    <div className="grid gap-5 md:gap-6">
      <section className="overflow-hidden rounded-[30px] bg-white/94 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 md:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-po-primary">
            <span className="grid size-7 place-items-center rounded-xl bg-po-primary-soft ring-1 ring-po-border/80">
              <Bot className="size-3.5" />
            </span>
            AI operations
          </div>
          <h2 className="mt-6 max-w-2xl text-3xl font-extrabold leading-[1.08] text-po-text md:text-5xl">
            Theo dõi <span className="text-po-primary">chatbot, RAG</span>
            <br />
            và chất lượng phản hồi.
          </h2>
          <p className="mt-6 max-w-xl text-sm font-medium leading-7 text-po-text-muted md:text-base md:leading-8">
            Trang này gom các chỉ số AI từ dashboard backend để admin biết mức sử dụng, tỷ lệ có
            trích dẫn nguồn và các intent đang phát sinh nhiều nhất.
          </p>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[28px] bg-white py-16 text-center shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AiMetricCard
              label="AI responses 7 ngày"
              value={formatNumber(aiStats?.aiResponsesLast7Days)}
              icon={MessageCircle}
              hint={`${formatNumber(aiStats?.totalAiResponses)} phản hồi tổng`}
            />
            <AiMetricCard
              label="Tỷ lệ dùng RAG"
              value={formatPercent(aiStats?.ragUsageRate)}
              icon={Database}
              hint={`${formatNumber(aiStats?.ragResponsesLast7Days)} phản hồi RAG / 7 ngày`}
            />
            <AiMetricCard
              label="Nguồn trích dẫn"
              value={formatNumber(aiStats?.sourceBackedResponsesLast7Days)}
              icon={FileText}
              hint={`${formatNumber(aiStats?.averageChunksUsedLast7Days)} chunks trung bình`}
            />
            <AiMetricCard
              label="AI lỗi 7 ngày"
              value={formatNumber(aiStats?.failedResponsesLast7Days)}
              icon={AlertCircle}
              hint={`${formatNumber(aiStats?.totalTokensLast7Days)} tokens đã dùng`}
              tone="warning"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
              <SectionHeading
                icon={TrendingUp}
                title="Intent nổi bật"
                subtitle="Các nhóm câu hỏi chatbot nhận nhiều nhất trong hệ thống AI hiện tại."
              />

              {intentStats.length === 0 ? (
                <EmptyState
                  icon={Bot}
                  title="Chưa có dữ liệu intent"
                  description="Khi AI xử lý hội thoại, intent và số lần dùng RAG sẽ hiển thị ở đây."
                  className="rounded-[24px] bg-po-surface-muted/60"
                />
              ) : (
                <div className="mt-6 grid gap-4">
                  {intentStats.map((item) => {
                    const width = `${Math.max(8, Math.round((item.count / maxIntentCount) * 100))}%`

                    return (
                      <article
                        key={item.intent}
                        className="rounded-[22px] bg-white/82 p-5 ring-1 ring-po-border/75"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-extrabold capitalize text-po-text">
                              {item.intent}
                            </h3>
                            <p className="mt-2 text-sm font-medium text-po-text-muted">
                              {formatNumber(item.ragCount)} lượt có RAG
                            </p>
                          </div>
                          <span className="text-sm font-extrabold text-po-primary">
                            {formatNumber(item.count)} lượt
                          </span>
                        </div>
                        <div className="mt-5 h-2.5 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-po-border/50">
                          <div className="h-full rounded-2xl bg-po-primary" style={{ width }} />
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <div className="grid content-start gap-5">
              <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
                <SectionHeading
                  icon={ShieldCheck}
                  title="Chất lượng phản hồi"
                  subtitle="Các chỉ số lưu nhanh để phát hiện AI đang thiếu dữ liệu hoặc trả lời kém."
                />

                <div className="mt-6 grid gap-3">
                  {[
                    {
                      label: "Hội thoại có AI",
                      value: formatNumber(aiStats?.activeConversationsLast7Days),
                      icon: MessageCircle,
                      detail: "Conversations có phát sinh message trong 7 ngày.",
                    },
                    {
                      label: "RAG responses tổng",
                      value: formatNumber(aiStats?.ragResponses),
                      icon: Database,
                      detail: "Tổng phản hồi đã đánh dấu flag/used.",
                    },
                    {
                      label: "Tokens 7 ngày",
                      value: formatNumber(aiStats?.totalTokensLast7Days),
                      icon: Gauge,
                      detail: "Tổng input + output tokens backend lưu lại.",
                    },
                  ].map((item) => (
                    <article
                      key={item.label}
                      className="flex items-center gap-4 rounded-[22px] bg-white/82 p-4 ring-1 ring-po-border/75"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
                        <item.icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-po-text">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-po-text-muted">{item.detail}</p>
                      </div>
                      <span className="shrink-0 text-2xl font-extrabold tabular-nums text-po-primary">
                        {item.value}
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
                <SectionHeading
                  icon={Bell}
                  title="Cảnh báo hệ thống"
                  subtitle="Các alert liên quan trực tiếp đến vận hành AI hoặc nền tảng."
                />

                {alertsLoading ? (
                  <div className="py-10 text-center">
                    <LoadingSpinner />
                  </div>
                ) : systemAlerts.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="Không có cảnh báo hệ thống"
                    description="Chưa có tín hiệu bất thường từ hệ thống."
                    className="mt-6 rounded-[24px] border border-dashed border-po-border bg-po-surface-muted/40"
                  />
                ) : (
                  <div className="mt-6 grid gap-3">
                    {systemAlerts.map((alert) => (
                      <article
                        key={alert.alertId}
                        className="rounded-[22px] bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-po-text">{alert.title}</h3>
                            <p className="mt-1 text-xs leading-5 text-po-text-muted">
                              {alert.description}
                            </p>
                          </div>
                          <StatusBadge
                            variant={
                              alert.severity === "high"
                                ? "danger"
                                : alert.severity === "medium"
                                  ? "warning"
                                  : "default"
                            }
                            label={alert.severity}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AiMetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string
  value: string
  icon: ElementType
  hint?: string
  tone?: Tone
}) {
  const toneClass = toneClasses[tone]

  return (
    <div className="rounded-[22px] bg-white/90 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", toneClass.bg, toneClass.text)}>
          <Icon className="size-5" />
        </span>
        <p className="pt-1 text-sm font-extrabold leading-5 text-po-text">{label}</p>
      </div>
      <p className="mt-8 text-4xl font-extrabold leading-none text-po-text tabular-nums">{value}</p>
      {hint ? <p className="mt-3 text-sm font-medium leading-5 text-po-text-muted">{hint}</p> : null}
    </div>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ElementType
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-2xl font-extrabold leading-tight text-po-text">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-po-text-muted">
          {subtitle}
        </p>
      </div>
    </div>
  )
}
