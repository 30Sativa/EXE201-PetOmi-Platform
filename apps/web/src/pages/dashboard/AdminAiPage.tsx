import {
  AlertCircle,
  Bot,
  Database,
  Gauge,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/ui/EmptyState"
import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { getAdminAlertsApi, getAdminDashboardApi } from "@/services/admin.service"

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
    staleTime: 60 * 1000,
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["admin", "alerts", "ai"],
    queryFn: () => getAdminAlertsApi({ maxItems: 25 }),
    staleTime: 30 * 1000,
  })

  const aiStats = dashboard?.aiStats
  const intentStats = dashboard?.aiIntentStats ?? []
  const systemAlerts = (alertsData?.items ?? []).filter((alert) => alert.type === "system")
  const maxIntentCount = Math.max(...intentStats.map((item) => item.count), 1)

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
              AI operations
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.08] md:text-5xl">
              Theo dõi chatbot, RAG và chất lượng phản hồi.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-po-text-muted md:text-base md:leading-8">
              Trang này gom các chỉ số AI từ dashboard backend để admin biết mức sử dụng,
              tỷ lệ có trích dẫn nguồn và các intent đang phát sinh nhiều nhất.
            </p>
          </div>

          <div className="relative min-h-[240px] overflow-hidden bg-[radial-gradient(circle_at_24%_24%,rgba(52,211,153,0.18),transparent_32%),linear-gradient(135deg,#fff7ed,#f6fffb)] lg:min-h-full">
            <div className="absolute right-8 top-8 grid size-28 place-items-center rounded-[32px] bg-white/72 text-po-primary shadow-xl shadow-orange-200/25 ring-1 ring-po-border/70 backdrop-blur">
              <Bot className="size-12" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-[24px] bg-white/90 p-4 shadow-xl shadow-orange-200/20 ring-1 ring-po-border/70 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold text-po-text">
                <Sparkles className="size-4 text-po-primary" />
                AI signal board
              </div>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">
                Tập trung vào phản hồi lỗi, RAG usage và intent lệch khỏi kỳ vọng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[28px] bg-white py-16 text-center shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="AI responses 7 ngày"
              value={formatNumber(aiStats?.aiResponsesLast7Days)}
              icon={MessageCircle}
              hint={`${formatNumber(aiStats?.totalAiResponses)} phản hồi tổng`}
            />
            <StatCard
              label="Tỷ lệ dùng RAG"
              value={formatPercent(aiStats?.ragUsageRate)}
              icon={Database}
              hint={`${formatNumber(aiStats?.ragResponsesLast7Days)} phản hồi RAG / 7 ngày`}
            />
            <StatCard
              label="Nguồn trích dẫn"
              value={formatNumber(aiStats?.sourceBackedResponsesLast7Days)}
              icon={ShieldAlert}
              hint={`${formatNumber(aiStats?.averageChunksUsedLast7Days)} chunks trung bình`}
            />
            <StatCard
              label="AI lỗi 7 ngày"
              value={formatNumber(aiStats?.failedResponsesLast7Days)}
              icon={AlertCircle}
              hint={`${formatNumber(aiStats?.totalTokensLast7Days)} tokens đã dùng`}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <DashboardSection
              title="Intent nổi bật"
              subtitle="Các nhóm câu hỏi chatbot nhận nhiều nhất trong kỳ thống kê hiện tại."
            >
              {intentStats.length === 0 ? (
                <EmptyState
                  icon={Bot}
                  title="Chưa có dữ liệu intent"
                  description="Khi AI xử lý hội thoại, intent và số lần dùng RAG sẽ hiển thị ở đây."
                  className="rounded-[24px] bg-po-surface-muted/60"
                />
              ) : (
                <div className="grid gap-3">
                  {intentStats.map((item) => {
                    const width = `${Math.max(8, Math.round((item.count / maxIntentCount) * 100))}%`

                    return (
                      <article
                        key={item.intent}
                        className="rounded-[22px] bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-extrabold capitalize text-po-text">
                              {item.intent}
                            </h3>
                            <p className="mt-1 text-xs text-po-text-muted">
                              {formatNumber(item.ragCount)} lượt có RAG
                            </p>
                          </div>
                          <StatusBadge variant="info" label={`${formatNumber(item.count)} lượt`} />
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-2xl bg-white ring-1 ring-po-border/60">
                          <div className="h-full rounded-2xl bg-po-primary" style={{ width }} />
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </DashboardSection>

            <div className="grid gap-5">
              <DashboardSection
                title="Chất lượng phản hồi"
                subtitle="Các tín hiệu nhanh để phát hiện AI đang thiếu dữ liệu hoặc trả lời lỗi."
              >
                <div className="grid gap-3">
                  {[
                    {
                      label: "Hội thoại có AI",
                      value: formatNumber(aiStats?.activeConversationsLast7Days),
                      icon: MessageCircle,
                      detail: "Conversation có phát sinh message trong 7 ngày.",
                    },
                    {
                      label: "RAG responses tổng",
                      value: formatNumber(aiStats?.ragResponses),
                      icon: Database,
                      detail: "Tổng phản hồi đã đánh dấu RagUsed.",
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
                      className="flex items-start gap-3 rounded-[22px] bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
                        <item.icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-po-text">{item.label}</p>
                          <span className="text-lg font-extrabold tabular-nums text-po-primary">
                            {item.value}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-po-text-muted">{item.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </DashboardSection>

              <DashboardSection title="Cảnh báo hệ thống" subtitle="Các alert liên quan trực tiếp đến vận hành AI hoặc nền tảng.">
                {alertsLoading ? (
                  <div className="py-10 text-center">
                    <LoadingSpinner />
                  </div>
                ) : systemAlerts.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="Không có cảnh báo hệ thống"
                    description="Chưa có tín hiệu bất thường từ hệ thống."
                    className="rounded-[24px] bg-po-surface-muted/60"
                  />
                ) : (
                  <div className="grid gap-3">
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
              </DashboardSection>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
