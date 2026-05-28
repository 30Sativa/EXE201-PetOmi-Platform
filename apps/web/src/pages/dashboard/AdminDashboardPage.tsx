import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  XCircle,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatCard from "@/components/dashboard/StatCard"
import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { getAdminDashboardApi, getAdminClinicsApi } from "@/services/admin.service"
import type {
  ClinicListItemResponse,
  PagedData,
} from "@/types"

const fallbackClinics: ClinicListItemResponse[] = [
  {
    clinicId: "sample-happy-vet",
    clinicName: "Happy Vet Care",
    address: "Quan 7, TP.HCM",
    phone: "0901 222 333",
    email: "hello@happyvet.vn",
    licenseNumber: "GPKD-2026-118",
    licenseImageUrl: null,
    licenseCloudinaryPublicId: null,
    status: "Pending",
    rejectedReason: null,
    createdAt: new Date().toISOString(),
  },
  {
    clinicId: "sample-sunrise-clinic",
    clinicName: "Sunrise Pet Clinic",
    address: "Thu Duc, TP.HCM",
    phone: "0908 777 121",
    email: "review@sunrise.pet",
    licenseNumber: "GPKD-2026-042",
    licenseImageUrl: null,
    licenseCloudinaryPublicId: null,
    status: "Pending",
    rejectedReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    clinicId: "sample-paw-house",
    clinicName: "Paw House Animal Hospital",
    address: "Binh Thanh, TP.HCM",
    phone: "0912 890 123",
    email: "ops@pawhouse.vn",
    licenseNumber: "GPKD-2026-073",
    licenseImageUrl: null,
    licenseCloudinaryPublicId: null,
    status: "Pending",
    rejectedReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
]

const systemSignals = [
  { label: "Auth & JWT", value: "Stable", tone: "success", detail: "Role claim đã sẵn sàng cho policy" },
  { label: "Clinic review", value: "12m avg", tone: "info", detail: "Thời gian xử lý trung bình" },
  { label: "Security alerts", value: "3 open", tone: "warning", detail: "Cần kiểm tra trong ngày" },
] as const

const auditFeed = [
  { action: "ApproveClinic", actor: "admin@petomi.vn", time: "09:42", result: "Completed" },
  { action: "RejectClinic", actor: "reviewer@petomi.vn", time: "08:18", result: "Needs follow-up" },
  { action: "ToggleRole", actor: "system", time: "Yesterday", result: "Logged" },
]

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
    retry: false,
    staleTime: 30 * 1000,
  })

  const realClinicItems = getPagedItems(pendingClinics)
  const clinicQueue = realClinicItems.length > 0 ? realClinicItems : fallbackClinics
  const pendingCount = getPagedTotal(pendingClinics) || fallbackClinics.length
  const queueSource = realClinicItems.length > 0 ? "Dữ liệu backend" : "Sample preview"

  const summary = dashboard?.summary
  const userStats = dashboard?.userStats
  const clinicStats = dashboard?.clinicStats

  return (
    <div className="grid gap-5 md:gap-6">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
              Admin command center
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.08] md:text-5xl">
              Duyệt clinic nhanh, giữ hệ thống PetOmi gọn và an toàn.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-po-text-muted md:text-base md:leading-8">
              Theo dõi hồ sơ đang chờ, tín hiệu bảo mật và các nhóm quyền quan trọng trong
              một dashboard có cùng UX với owner workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard/admin/clinics")}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0"
              >
                <BadgeCheck className="size-4" />
                Mở queue duyệt
              </button>
              <button
                onClick={() => navigate("/dashboard/admin/users")}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-po-surface-muted px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0"
              >
                <UsersRound className="size-4" />
                Quản lý người dùng
              </button>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <HeroMetric label="Clinic pending" value={String(pendingCount)} />
              <HeroMetric label="Review SLA" value="12m" />
              <HeroMetric label="Policy roles" value="3" />
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
                Một màn hình cho các quyết định nhạy cảm: approve, reject, role và audit.
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
              label="Clinic chờ duyệt"
              value={String(clinicStats?.pending ?? 0)}
              icon={BadgeCheck}
              hint={queueSource}
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
              label="Tổng clinic"
              value={String(clinicStats?.total ?? 0)}
              icon={Building2}
              hint={`${clinicStats?.approved ?? 0} đã duyệt, ${clinicStats?.rejected ?? 0} từ chối`}
            />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <DashboardSection
          title="Queue duyệt clinic"
          subtitle="Hồ sơ đang chờ admin xác minh giấy phép, thông tin liên hệ và trạng thái hoạt động."
          action={
            <button
              onClick={() => navigate("/dashboard/admin/clinics")}
              className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
            >
              Xem tất cả
            </button>
          }
        >
          {clinicLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
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

        <DashboardSection title="System pulse" subtitle="Những tín hiệu cần admin nhìn trước khi thao tác.">
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
        </DashboardSection>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardSection
          title="Role matrix"
          subtitle="Tóm tắt nhóm quyền chính để đối chiếu với policy backend."
          action={
            <button
              onClick={() => navigate("/dashboard/admin/users")}
              className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
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
                { name: "Owner", permissions: "Pets, bookings, reminders", users: userStats?.owners ?? 0 },
                { name: "Vet", permissions: "Clinic mode, medical records", users: userStats?.vets ?? 0 },
                { name: "Admin", permissions: "Clinic review, roles, audit", users: userStats?.admins ?? 0 },
              ].map((role) => (
                <div
                  key={role.name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-po-surface-muted/70 px-4 py-3 ring-1 ring-po-border/70 transition hover:bg-white hover:shadow-sm hover:shadow-orange-200/20"
                >
                  <div>
                    <p className="text-sm font-semibold text-po-text">{role.name}</p>
                    <p className="mt-0.5 text-xs text-po-text-muted">{role.permissions}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-po-primary ring-1 ring-po-border/80">
                    {role.users} users
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Audit activity" subtitle="Các hành động quan trọng gần đây trong auth và clinic review.">
          <div className="grid gap-3">
            {auditFeed.map((item) => (
              <div key={`${item.action}-${item.time}`} className="flex items-center gap-3 rounded-2xl bg-po-surface-muted/70 px-4 py-3 ring-1 ring-po-border/70">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
                  <TrendingUp className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-po-text">{item.action}</p>
                  <p className="truncate text-xs text-po-text-muted">{item.actor}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-po-text">{item.time}</p>
                  <p className="text-xs text-po-text-muted">{item.result}</p>
                </div>
              </div>
            ))}
          </div>
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
          <span>License: {clinic.licenseNumber ?? "Chưa cập nhật"}</span>
          <span>Email: {clinic.email ?? "Chưa có"}</span>
          <span>Submitted: {formatDate(clinic.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        <button
          onClick={onReview}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-po-success ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        >
          <CheckCircle2 className="size-3.5" />
          Approve
        </button>
        <button
          onClick={onReview}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-po-danger ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        >
          <XCircle className="size-3.5" />
          Reject
        </button>
        <button
          onClick={onReview}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-po-primary-soft px-3 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
        >
          <Clock3 className="size-3.5" />
          Review
        </button>
      </div>
    </div>
  )
}
