import {
  BadgeCheck,
  Bot,
  Building2,
  Database,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/ui/EmptyState"
import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import {
  getAdminAlertsApi,
  getAdminDashboardApi,
  getAdminClinicsApi,
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
    queryFn: () => getAuditLogsApi({ page: 1, pageSize: 5 }),
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

  const systemSignals = [
    {
      label: "Cảnh báo mức cao",
      value: String(highAlerts),
      tone: highAlerts > 0 ? ("danger" as const) : ("success" as const),
      detail: highAlerts > 0 ? "Cần xử lý ngay" : "Không có cảnh báo nghiêm trọng",
    },
    {
      label: "Tổng cảnh báo",
      value: String(totalAlerts),
      tone: totalAlerts > 0 ? ("warning" as const) : ("success" as const),
      detail: "Trạng thái cảnh báo toàn bộ hệ thống",
    },
    {
      label: "Audit hôm nay",
      value: String(auditToday),
      tone: "info" as const,
      detail: "Số hành động quản trị trong ngày",
    },
  ]

  return (
    <div className="grid gap-5 md:gap-6">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
              Admin command center
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.08] md:text-5xl">
              Duyệt phòng khám nhanh, giữ PetOmi gọn và an toàn.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-po-text-muted md:text-base md:leading-8">
              Theo dõi hồ sơ đang chờ, cảnh báo hệ thống và các hành động quản trị
              mới nhất trong một dashboard duy nhất.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard/admin/clinics")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-po-primary px-5 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0 max-[480px]:w-full"
              >
                <BadgeCheck className="size-4" />
                Mở danh sách duyệt
              </button>
              <button
                onClick={() => navigate("/dashboard/admin/users")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-po-surface-muted px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0 max-[480px]:w-full"
              >
                <UsersRound className="size-4" />
                Quản lý người dùng
              </button>
              <button
                onClick={() => navigate("/dashboard/admin/ai")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-po-primary ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 max-[480px]:w-full"
              >
                <Bot className="size-4" />
                Xem AI monitor
              </button>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <HeroMetric label="Phòng khám chờ" value={String(pendingCount)} />
              <HeroMetric label="Cảnh báo cao" value={String(highAlerts)} />
              <HeroMetric label="Admin" value={String(userStats?.admins ?? 0)} />
            </div>
          </div>

          <div className="relative min-h-[260px] overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(255,122,26,0.22),transparent_32%),linear-gradient(135deg,#fff7ed,#f6fffb)] lg:min-h-full">
            <div className="absolute right-8 top-8 grid size-28 place-items-center rounded-[32px] bg-white/70 text-po-primary shadow-xl shadow-orange-200/30 ring-1 ring-po-border/70 backdrop-blur">
              <ShieldCheck className="size-12" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-[24px] bg-white/[0.9] p-4 text-po-text shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-po-primary" />
                Admin review mode
              </div>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">
                Một màn hình cho các quyết định nhạy cảm: duyệt, từ chối, role và audit.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Phòng khám chờ duyệt"
              value={String(clinicStats?.pending ?? 0)}
              icon={BadgeCheck}
              hint="Dữ liệu backend"
            />
            <StatCard
              label="Tài khoản hoạt động"
              value={String(summary?.activeUsers ?? 0)}
              icon={UsersRound}
              hint="Owner + Vet + Admin"
            />
            <StatCard
              label="Tổng người dùng"
              value={String(summary?.totalUsers ?? 0)}
              icon={UsersRound}
              hint="Tất cả tài khoản"
            />
            <StatCard
              label="Tổng phòng khám"
              value={String(clinicStats?.total ?? 0)}
              icon={Building2}
              hint={`${clinicStats?.approved ?? 0} đã duyệt, ${clinicStats?.rejected ?? 0} từ chối`}
            />
          </>
        )}
      </div>

      <DashboardSection
        title="AI / RAG intelligence"
        subtitle="Phân tích hoạt động chatbot, mức dùng RAG và intent nổi bật từ dữ liệu ChatMessages."
        action={
          <button
            onClick={() => navigate("/dashboard/admin/ai")}
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0 max-[420px]:w-full"
          >
            Mở AI monitor
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
              <StatCard
                label="AI responses 7 ngày"
                value={formatNumber(aiStats?.aiResponsesLast7Days)}
                icon={Bot}
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
                icon={MessageCircle}
                hint={`${formatNumber(aiStats?.averageChunksUsedLast7Days)} chunks trung bình`}
              />
              <StatCard
                label="AI lỗi 7 ngày"
                value={formatNumber(aiStats?.failedResponsesLast7Days)}
                icon={TrendingUp}
                hint={`${formatNumber(aiStats?.totalTokensLast7Days)} tokens đã dùng`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div className="rounded-[26px] bg-po-surface-muted/70 p-5 ring-1 ring-po-border/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-po-text">Top intent 30 ngày</p>
                    <p className="mt-1 text-xs leading-5 text-po-text-muted">
                      Nhóm câu hỏi AI nhận nhiều nhất, kèm số lần có RAG.
                    </p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
                    <Bot className="size-4" />
                  </span>
                </div>

                {aiIntentStats.length === 0 ? (
                  <EmptyState
                    icon={Bot}
                    title="Chưa có dữ liệu intent"
                    description="Khi chatbot xử lý câu hỏi, intent và RAG usage sẽ hiện ở đây."
                  />
                ) : (
                  <div className="mt-4 grid gap-3">
                    {aiIntentStats.map((item) => {
                      const maxCount = Math.max(...aiIntentStats.map((intent) => intent.count), 1)
                      const width = `${Math.max(8, Math.round((item.count / maxCount) * 100))}%`

                      return (
                        <div key={item.intent} className="rounded-2xl bg-white/80 p-4 ring-1 ring-po-border/70">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold capitalize text-po-text">{item.intent}</p>
                            <p className="text-xs font-semibold text-po-primary">
                              {formatNumber(item.count)} lượt
                            </p>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-2xl bg-po-primary-soft">
                            <div className="h-full rounded-2xl bg-po-primary" style={{ width }} />
                          </div>
                          <p className="mt-2 text-xs text-po-text-muted">
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
                    label: "Hội thoại có AI",
                    value: formatNumber(aiStats?.activeConversationsLast7Days),
                    detail: "Conversation có phát sinh message trong 7 ngày.",
                  },
                  {
                    label: "RAG responses tổng",
                    value: formatNumber(aiStats?.ragResponses),
                    detail: "Tổng phản hồi AI đã đánh dấu RagUsed.",
                  },
                  {
                    label: "Tokens 7 ngày",
                    value: formatNumber(aiStats?.totalTokensLast7Days),
                    detail: "Tổng input + output tokens do backend lưu lại.",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] bg-white/85 p-4 ring-1 ring-po-border/80">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-po-text">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-po-text-muted">{item.detail}</p>
                      </div>
                      <StatusBadge variant="info" label={item.value} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DashboardSection>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <DashboardSection
          title="Hồ sơ phòng khám chờ duyệt"
          subtitle="Hồ sơ đang chờ admin xác minh giấy phép và thông tin liên hệ."
          action={
            <button
              onClick={() => navigate("/dashboard/admin/clinics")}
              className="inline-flex h-9 items-center rounded-2xl bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
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

        <DashboardSection title="System pulse" subtitle="Tín hiệu hệ thống admin cần theo dõi.">
          {alertsLoading || auditLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-3">
              {systemSignals.map((item) => (
                <div key={item.label} className="rounded-2xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-po-text">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-po-text-muted">{item.detail}</p>
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
          subtitle="Tóm tắt nhóm quyền chính để đối chiếu với policy backend."
          action={
            <button
              onClick={() => navigate("/dashboard/admin/users")}
              className="inline-flex h-9 items-center rounded-2xl bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
            >
              Xem người dùng
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
                { name: "Owner", permissions: "Thú cưng, lịch hẹn, nhắc nhở", users: userStats?.owners ?? 0 },
                { name: "Vet", permissions: "Phòng khám, hồ sơ y tế", users: userStats?.vets ?? 0 },
                { name: "Admin", permissions: "Duyệt phòng khám, roles, audit", users: userStats?.admins ?? 0 },
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

        <DashboardSection title="Audit activity" subtitle="Các hành động quan trọng gần đây trên hệ thống.">
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
                    <TrendingUp className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-po-text">{item.action}</p>
                    <p className="truncate text-xs text-po-text-muted">{item.actor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-po-text">{formatDateTime(item.createdAt)}</p>
                    <p className="text-xs text-po-text-muted">{item.severity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-po-surface-muted/75 p-4 ring-1 ring-po-border/70">
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-po-text-muted">{label}</p>
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
          <span>Giấy phép: {clinic.licenseNumber ?? "Chưa cập nhật"}</span>
          <span>Email: {clinic.email ?? "Chưa có"}</span>
          <span>Ngày gửi: {formatDate(clinic.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        <button
          onClick={onReview}
          className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-po-primary-soft px-3 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
        >
          Xem hồ sơ
        </button>
      </div>
    </div>
  )
}
