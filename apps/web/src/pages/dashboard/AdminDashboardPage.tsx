import {
  BadgeCheck,
  Bot,
  Building2,
  ChartNoAxesCombined,
  Database,
  FileText,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react"
import type { ElementType } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { cn } from "@/lib/utils"
import {
  getAdminAlertsApi,
  getAdminClinicsApi,
  getAdminDashboardApi,
  getAuditLogsApi,
} from "@/services/admin.service"
import type {
  AuditLogItemResponse,
  ClinicListItemResponse,
  PagedData,
} from "@/types"

type NormalizedAuditItem = {
  id: string
  action: string
  actor: string
  createdAt: string
  severity: string
}

type Tone = "primary" | "success" | "warning" | "danger" | "muted"

const toneClasses: Record<Tone, { text: string; bg: string }> = {
  primary: { text: "text-po-primary", bg: "bg-po-primary-soft" },
  success: { text: "text-po-success", bg: "bg-po-success-soft" },
  warning: { text: "text-po-warning", bg: "bg-po-warning-soft" },
  danger: { text: "text-po-danger", bg: "bg-po-danger-soft" },
  muted: { text: "text-po-text-muted", bg: "bg-po-surface-muted" },
}

function getPagedItems<T>(paged?: PagedData<T>) {
  return paged?.items ?? paged?.Items ?? []
}

function getPagedTotal<T>(paged?: PagedData<T>) {
  return paged?.meta?.totalRecords ?? paged?.Meta?.totalRecords ?? getPagedItems(paged).length
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

function formatPercent(value?: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(value ?? 0)}%`
}

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "success" as const
    case "rejected":
      return "danger" as const
    case "pending":
      return "warning" as const
    default:
      return "default" as const
  }
}

function normalizeAuditItem(log: AuditLogItemResponse): NormalizedAuditItem {
  const dynamicLog = log as AuditLogItemResponse & Record<string, unknown>
  const id = String(dynamicLog.auditLogId ?? dynamicLog.AuditLogId ?? "")
  const action = String(dynamicLog.action ?? dynamicLog.Action ?? "UnknownAction")
  const userEmail = String(dynamicLog.userEmail ?? dynamicLog.UserEmail ?? "System")
  const createdAt = String(dynamicLog.createdAt ?? dynamicLog.CreatedAt ?? new Date().toISOString())
  const severity = String(dynamicLog.severity ?? dynamicLog.Severity ?? "Info")

  return {
    id,
    action,
    actor: userEmail,
    createdAt,
    severity,
  }
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboardApi,
    staleTime: 60 * 1000,
  })

  const { data: pendingClinics, isLoading: clinicLoading } = useQuery({
    queryKey: ["admin", "clinics", "pending", "dashboard"],
    queryFn: () => getAdminClinicsApi({ status: "Pending", page: 1, pageSize: 5 }),
    staleTime: 30 * 1000,
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["admin", "alerts", "dashboard"],
    queryFn: () => getAdminAlertsApi({ maxItems: 10 }),
    staleTime: 30 * 1000,
  })

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["admin", "audit-logs", "dashboard"],
    queryFn: () => getAuditLogsApi({ page: 1, pageSize: 6 }),
    staleTime: 30 * 1000,
  })

  const clinicQueue = getPagedItems(pendingClinics)
  const auditItems = getPagedItems(auditLogs).map((item) => normalizeAuditItem(item as AuditLogItemResponse))
  const highAlerts = alertsData?.stats?.high ?? 0
  const totalAlerts = alertsData?.stats?.total ?? 0

  const auditToday = auditItems.filter((item) => {
    try {
      return new Date(item.createdAt).toDateString() === new Date().toDateString()
    } catch {
      return false
    }
  }).length

  const summary = dashboard?.summary
  const userStats = dashboard?.userStats
  const clinicStats = dashboard?.clinicStats
  const aiStats = dashboard?.aiStats
  const aiIntentStats = dashboard?.aiIntentStats ?? []
  const pendingCount = clinicStats?.pending ?? getPagedTotal(pendingClinics)
  const maxIntentCount = Math.max(...aiIntentStats.map((item) => item.count), 1)

  const systemSignals = [
    {
      label: "Cảnh báo mức cao",
      value: String(highAlerts),
      tone: highAlerts > 0 ? ("danger" as const) : ("success" as const),
      detail: highAlerts > 0 ? "Cần xử lý ngay trong hệ thống" : "Không có cảnh báo mức cao",
    },
    {
      label: "Tổng cảnh báo",
      value: String(totalAlerts),
      tone: totalAlerts > 0 ? ("warning" as const) : ("success" as const),
      detail: "Tổng tình huống cảnh báo toàn hệ thống",
    },
    {
      label: "Audit hôm nay",
      value: String(auditToday),
      tone: "warning" as const,
      detail: "Hành động quản trị phát sinh trong ngày",
    },
  ]

  return (
    <div className="grid gap-5 md:gap-6">
      <section className="overflow-hidden rounded-[30px] bg-white/94 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-po-primary">
              <span className="grid size-7 place-items-center rounded-xl bg-po-primary-soft ring-1 ring-po-border/80">
                <ShieldCheck className="size-3.5" />
              </span>
              Admin command center
            </div>

            <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-[1.08] text-po-text md:text-4xl">
              Duyệt phòng khám nhanh, giữ{" "}
              <span className="text-po-primary">PetOmi</span> gọn và an toàn.
            </h2>
            <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-po-text-muted">
              Theo dõi hiệu suất hệ thống và các hành động quản trị một cách nhanh chóng và dễ dàng.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard/admin/clinics")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-po-primary px-5 text-sm font-semibold text-white shadow-lg shadow-orange-950/15 transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0 max-[480px]:w-full"
              >
                <BadgeCheck className="size-4" />
                Mở danh sách duyệt
              </button>
              <button
                onClick={() => navigate("/dashboard/admin/users")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/90 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 max-[480px]:w-full"
              >
                <UserRound className="size-4" />
                Quản lý người dùng
              </button>
              <button
                onClick={() => navigate("/dashboard/admin/ai")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/90 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 max-[480px]:w-full"
              >
                <ChartNoAxesCombined className="size-4 text-po-primary" />
                Xem AI monitor
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
            <HeroMetric
              label="Phòng khám chờ duyệt"
              value={String(pendingCount)}
              icon={Building2}
            />
            <HeroMetric
              label="Cảnh báo an ninh"
              value={String(highAlerts)}
              icon={ShieldCheck}
            />
            <HeroMetric
              label="Admin"
              value={String(userStats?.admins ?? 0)}
              icon={UserRound}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <DashboardMetricCard
              label="Phòng khám chờ duyệt"
              value={String(clinicStats?.pending ?? 0)}
              icon={BadgeCheck}
              hint="Dữ liệu backend"
            />
            <DashboardMetricCard
              label="Tài khoản hoạt động"
              value={String(summary?.activeUsers ?? 0)}
              icon={UsersRound}
              hint="Owner + Vet + Admin"
            />
            <DashboardMetricCard
              label="Tổng người dùng"
              value={String(summary?.totalUsers ?? 0)}
              icon={UsersRound}
              hint="Tất cả tài khoản"
            />
            <DashboardMetricCard
              label="Tổng phòng khám"
              value={String(clinicStats?.total ?? 0)}
              icon={Building2}
              hint={`${clinicStats?.approved ?? 0} đã duyệt & ${clinicStats?.rejected ?? 0} đã xuất`}
            />
          </>
        )}
      </div>

      <DashboardSection
        title="AI / RAG intelligence"
        subtitle="Phân tích hoạt động chatbot, mức dùng RAG và intent dữ liệu từ OLMs, ChatMessage."
        action={
          <button
            onClick={() => navigate("/dashboard/admin/ai")}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0 max-[420px]:w-full"
          >
            Mở AI monitor →
          </button>
        }
      >
        {dashLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardMetricCard
                label="AI responses 7 ngày"
                value={formatNumber(aiStats?.aiResponsesLast7Days)}
                icon={Bot}
                hint={`${formatNumber(aiStats?.totalAiResponses)} yêu cầu hệ thống`}
              />
              <DashboardMetricCard
                label="Tỷ lệ dùng RAG"
                value={formatPercent(aiStats?.ragUsageRate)}
                icon={Database}
                hint={`${formatNumber(aiStats?.ragResponsesLast7Days)} phiên hỏi RAG / 7 ngày`}
              />
              <DashboardMetricCard
                label="Nguồn trích dẫn"
                value={formatNumber(aiStats?.sourceBackedResponsesLast7Days)}
                icon={FileText}
                hint="OLMs/Intent trong tuần"
              />
              <DashboardMetricCard
                label="AI lỗi 7 ngày"
                value={formatNumber(aiStats?.failedResponsesLast7Days)}
                icon={TrendingUp}
                hint="Lỗi lỗi/timeout đã xử lý"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div className="rounded-[26px] bg-po-surface-muted/70 p-5 ring-1 ring-po-border/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-po-text">Top intent 20 ngày</p>
                    <p className="mt-1 text-xs leading-5 text-po-text-muted">
                      Nhóm câu hỏi AI nhận nhiều nhất, kèm số lần và tỉ lệ RAG.
                    </p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
                    <MessageCircle className="size-4" />
                  </span>
                </div>

                {aiIntentStats.length === 0 ? (
                  <EmptyState
                    icon={Bot}
                    title="Chưa có dữ liệu intent"
                    description="Khi chatbot xử lý câu hỏi, intent và RAG usage sẽ hiện ở đây."
                  />
                ) : (
                  <div className="mt-4 grid gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-po-border/70">
                    {aiIntentStats.slice(0, 3).map((item) => {
                      const width = `${Math.max(8, Math.round((item.count / maxIntentCount) * 100))}%`

                      return (
                        <div key={item.intent}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold capitalize text-po-text">{item.intent}</p>
                            <p className="text-xs font-semibold text-po-primary">
                              {formatNumber(item.count)} lượt
                            </p>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-2xl bg-po-primary-soft">
                            <div className="h-full rounded-2xl bg-po-primary" style={{ width }} />
                          </div>
                          <p className="mt-1.5 text-xs text-po-text-muted">
                            {formatNumber(item.ragCount)} lượt dùng RAG
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid content-start gap-3">
                {[
                  {
                    label: "Kiểm tra OLM",
                    value: formatNumber(aiStats?.activeConversationsLast7Days),
                    detail: "Conversations có phát sinh message trong 7 ngày.",
                    icon: MessageCircle,
                  },
                  {
                    label: "RAG response chậm",
                    value: formatNumber(aiStats?.ragResponses),
                    detail: "Trung bình thời gian phản hồi RAG/intent.",
                    icon: Database,
                  },
                  {
                    label: "Timeout 7 ngày",
                    value: formatPercent(0),
                    detail: "Tổng lượt yêu cầu có timeout từ backend hoặc LLM.",
                    icon: TrendingUp,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] bg-white/85 p-4 ring-1 ring-po-border/80">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-po-text">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-po-text-muted">{item.detail}</p>
                      </div>
                      <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                        <item.icon className="size-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DashboardSection>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <DashboardSection
          title="Hồ sơ phòng khám chờ duyệt"
          subtitle="Hồ sơ đang chờ admin xác minh giấy phép và thông tin liên hệ."
          action={
            <button
              onClick={() => navigate("/dashboard/admin/clinics")}
              className="inline-flex h-9 items-center rounded-xl bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
            >
              Xem tất cả
            </button>
          }
        >
          {clinicLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : clinicQueue.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Không có phòng khám chờ duyệt"
              description="Tất cả hồ sơ đã được xử lý."
            />
          ) : (
            <div className="grid gap-3">
              {clinicQueue.map((clinic) => (
                <ClinicReviewRow
                  key={clinic.clinicId}
                  clinic={clinic}
                  onReview={() => navigate("/dashboard/admin/clinics")}
                />
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="System pulse" subtitle="Tóm tắt hệ thống và cảnh báo nhanh.">
          {alertsLoading || auditLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-3">
              {systemSignals.map((item) => (
                <div key={item.label} className="rounded-2xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
                        <ChartNoAxesCombined className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-po-text">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-po-text-muted">{item.detail}</p>
                      </div>
                    </div>
                    <StatusBadge variant={item.tone} label={item.value} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardSection
          title="Role matrix"
          subtitle="Tóm tắt nhóm quyền quản trị để đối chiếu và phân quyền."
          action={
            <button
              onClick={() => navigate("/dashboard/admin/users")}
              className="inline-flex h-9 items-center rounded-xl bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
            >
              Xem quản lý
            </button>
          }
        >
          {dashLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-3">
              {[
                { name: "Owner", permissions: "Toàn quyền, cấu hình, nhân sự", users: userStats?.owners ?? 0 },
                { name: "Vet", permissions: "Phòng khám, hồ sơ y tế", users: userStats?.vets ?? 0 },
                { name: "Admin", permissions: "Duyệt phòng khám, system, audit", users: userStats?.admins ?? 0 },
              ].map((role) => (
                <div
                  key={role.name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-po-surface-muted/70 px-4 py-3 ring-1 ring-po-border/70 transition hover:bg-white hover:shadow-sm hover:shadow-orange-200/20"
                >
                  <div>
                    <p className="text-sm font-semibold text-po-text">{role.name}</p>
                    <p className="mt-0.5 text-xs text-po-text-muted">{role.permissions}</p>
                  </div>
                  <span className="rounded-2xl bg-white px-3 py-1 text-xs font-semibold text-po-primary ring-1 ring-po-border/80">
                    {role.users} users
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Audit activity"
          subtitle="Các hành động quản trị gần đây, hiển thị 6 mốc mới nhất."
          action={
            <button
              onClick={() => navigate("/dashboard/admin/audit-logs")}
              className="text-xs font-semibold text-po-primary transition hover:text-po-primary-hover"
            >
              Xem tất cả
            </button>
          }
        >
          {auditLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : auditItems.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Chưa có audit log"
              description="Không có hành động quản trị gần đây."
            />
          ) : (
            <div className="grid gap-3">
              {auditItems.map((item) => (
                <div key={item.id || `${item.action}-${item.createdAt}`} className="flex items-center gap-3 rounded-2xl bg-po-surface-muted/70 px-4 py-3 ring-1 ring-po-border/70">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
                    <ChartNoAxesCombined className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-po-text">{item.action}</p>
                    <p className="truncate text-xs text-po-text-muted">{item.actor}</p>
                  </div>
                  <p className="text-right text-xs font-semibold text-po-text">{formatDateTime(item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  )
}

function HeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: ElementType
}) {
  return (
    <div className="relative min-h-32 rounded-[20px] bg-po-surface-muted/55 p-5 ring-1 ring-po-border/70">
      <p className="text-3xl font-extrabold tabular-nums text-po-text">{value}</p>
      <p className="mt-3 max-w-28 text-xs font-semibold leading-5 text-po-text-muted">{label}</p>
      <Icon className="absolute right-5 top-5 size-5 text-po-primary" />
    </div>
  )
}

function DashboardMetricCard({
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
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold leading-5 text-po-text">{label}</p>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", toneClass.bg, toneClass.text)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-extrabold leading-none text-po-text tabular-nums">{value}</p>
      {hint ? <p className="mt-3 text-xs font-medium leading-5 text-po-text-muted">{hint}</p> : null}
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="rounded-[22px] bg-white p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 animate-pulse">
      <div className="size-9 rounded-2xl bg-po-surface-muted mb-3" />
      <div className="h-7 w-16 rounded-lg bg-po-surface-muted mb-2" />
      <div className="h-4 w-24 rounded bg-po-surface-muted" />
    </div>
  )
}

function ClinicReviewRow({
  clinic,
  onReview,
}: {
  clinic: ClinicListItemResponse
  onReview: () => void
}) {
  return (
    <div className="grid gap-4 rounded-2xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70 transition hover:bg-white hover:shadow-sm hover:shadow-orange-200/20 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid size-9 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-po-text">{clinic.clinicName}</p>
            <p className="truncate text-xs text-po-text-muted">{clinic.address ?? "Chưa có địa chỉ"}</p>
          </div>
          <StatusBadge variant={statusVariant(clinic.status)} label={clinic.status} />
        </div>
        <div className="mt-3 grid gap-2 text-xs text-po-text-muted sm:grid-cols-3">
          <span>Giấy phép: {clinic.licenseImageUrl || clinic.hasLicenseFile ? "Đã gửi file" : "Chưa có file"}</span>
          <span>Email: {clinic.email ?? "Chưa có"}</span>
          <span>Ngày gửi: {formatDate(clinic.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        <button
          onClick={onReview}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-po-primary-soft px-3 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
        >
          Xem hồ sơ
        </button>
      </div>
    </div>
  )
}
