import { useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Eye,
  MapPin,
  Phone,
  X,
  XCircle,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import AdminPageHeader from "@/components/dashboard/AdminPageHeader"
import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import RejectDialog from "@/components/ui/RejectDialog"
import {
  getAdminClinicsApi,
  approveClinicApi,
  rejectClinicApi,
} from "@/services/admin.service"
import type { ClinicListItemResponse, PagedData } from "@/types"

function getPagedItems<T>(paged?: PagedData<T>) {
  return paged?.items ?? paged?.Items ?? []
}

function getPagedMeta(paged?: PagedData<unknown>) {
  return paged?.meta ?? paged?.Meta
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

type StatusFilter = "Pending" | "Approved" | "Rejected"

function clinicStatusLabel(status: string) {
  switch (status) {
    case "Approved":
      return "Đã duyệt"
    case "Rejected":
      return "Từ chối"
    default:
      return "Chờ duyệt"
  }
}

function clinicStatusVariant(status: string) {
  switch (status) {
    case "Approved":
      return "success" as const
    case "Rejected":
      return "danger" as const
    default:
      return "warning" as const
  }
}

export default function AdminClinicsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Pending")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [approveTarget, setApproveTarget] = useState<ClinicListItemResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ClinicListItemResponse | null>(null)
  const [detailClinic, setDetailClinic] = useState<ClinicListItemResponse | null>(null)
  const [licensePreviewClinic, setLicensePreviewClinic] =
    useState<ClinicListItemResponse | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "clinics", statusFilter, page],
    queryFn: () => getAdminClinicsApi({ status: statusFilter, page, pageSize }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })

  const approveMutation = useMutation({
    mutationFn: (clinicId: string) => approveClinicApi(clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] })
      setApproveTarget(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ clinicId, reason }: { clinicId: string; reason: string }) =>
      rejectClinicApi(clinicId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] })
      setRejectTarget(null)
    },
  })

  const items = getPagedItems(data)
  const meta = getPagedMeta(data)
  const totalPages = meta?.totalPages ?? 1

  const statusTabs: { label: string; value: StatusFilter; color: string }[] = [
    { label: "Chờ duyệt", value: "Pending", color: "text-po-warning" },
    { label: "Đã duyệt", value: "Approved", color: "text-po-success" },
    { label: "Từ chối", value: "Rejected", color: "text-po-danger" },
  ]

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        kicker="Quản lý duyệt phòng khám"
        title="Duyệt phòng khám"
        description="Xem xét hồ sơ đăng ký, giấy phép và trạng thái xử lý của phòng khám."
        icon={BadgeCheck}
        metrics={[
          {
            label: "Chờ duyệt",
            value: String(statusFilter === "Pending" ? meta?.totalRecords ?? 0 : items.filter((c) => c.status === "Pending").length),
            icon: AlertCircle,
            tone: "warning",
          },
          {
            label: "Đã duyệt",
            value: String(statusFilter === "Approved" ? meta?.totalRecords ?? 0 : items.filter((c) => c.status === "Approved").length),
            icon: CheckCircle2,
            tone: "success",
          },
          {
            label: "Từ chối",
            value: String(statusFilter === "Rejected" ? meta?.totalRecords ?? 0 : items.filter((c) => c.status === "Rejected").length),
            icon: XCircle,
            tone: "danger",
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-po-border/80">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`shrink-0 whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-semibold transition ${
                statusFilter === tab.value
                  ? "bg-po-primary text-white"
                  : `${tab.color} hover:bg-po-surface-muted`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-shell">
        <div className="grid gap-3 p-3 md:hidden">
          {isLoading ? (
            <div className="py-14 text-center">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title={`Không có phòng khám nào ${statusFilter === "Pending" ? "chờ duyệt" : statusFilter === "Approved" ? "đã duyệt" : "bị từ chối"}`}
              description={
                statusFilter === "Pending"
                  ? "Tất cả phòng khám đã được xử lý."
                  : "Thử chọn trạng thái khác."
              }
            />
          ) : (
            items.map((clinic) => (
              <ClinicMobileCard
                key={clinic.clinicId}
                clinic={clinic}
                isApprovePending={approveMutation.isPending}
                isRejectPending={rejectMutation.isPending}
                onDetail={() => setDetailClinic(clinic)}
                onApprove={() => setApproveTarget(clinic)}
                onReject={() => setRejectTarget(clinic)}
                onPreviewLicense={() => setLicensePreviewClinic(clinic)}
              />
            ))
          )}
        </div>

        <div className="admin-table-scroll hidden md:block">
          <table className="admin-table min-w-[1040px]">
            <thead>
              <tr className="border-b border-po-border/60">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle w-full min-w-[180px]">
                  Phòng khám
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[140px]">
                  Liên hệ
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[130px]">
                  Giấy phép
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[100px]">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[90px]">
                  Ngày đăng ký
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[200px]">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-po-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={BadgeCheck}
                      title={`Không có phòng khám nào ${statusFilter === "Pending" ? "chờ duyệt" : statusFilter === "Approved" ? "đã duyệt" : "bị từ chối"}`}
                      description={
                        statusFilter === "Pending"
                          ? "Tất cả phòng khám đã được xử lý."
                          : "Thử chọn trạng thái khác."
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((clinic) => (
                  <tr
                    key={clinic.clinicId}
                    className="group transition hover:bg-po-surface-muted/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary text-sm font-bold">
                          {clinic.clinicName[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-po-text">
                            {clinic.clinicName}
                          </p>
                          {clinic.address && (
                            <div className="flex items-center gap-1.5 text-xs text-po-text-muted">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">{clinic.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-po-text-muted">
                              <Calendar className="size-3" />
                              <span className="text-[10px]">{formatDate(clinic.createdAt)}</span>
                            </span>
                            {clinic.licenseNumber && (
                              <span className="inline-flex items-center gap-1 text-po-primary">
                                <BadgeCheck className="size-3" />
                                <span className="text-[10px]">GPLX: {clinic.licenseNumber}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 shrink-0 w-[140px]">
                      <div className="space-y-1">
                        {clinic.email && (
                          <p className="text-xs text-po-text-muted truncate max-w-[140px]">
                            {clinic.email}
                          </p>
                        )}
                        {clinic.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-po-text-muted">
                            <Phone className="size-3 shrink-0" />
                            <span>{clinic.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 shrink-0 w-[130px]">
                      {clinic.licenseNumber ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-po-success text-xs">
                            <BadgeCheck className="size-3" />
                            {clinic.licenseNumber}
                          </span>
                          {clinic.licenseImageUrl && (
                            <button
                              type="button"
                              onClick={() => setLicensePreviewClinic(clinic)}
                              className="inline-flex items-center gap-1 text-po-primary text-xs font-semibold transition hover:text-po-primary-hover"
                            >
                              <Eye className="size-3" />
                              Xem ảnh
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-po-warning text-xs">
                          <AlertCircle className="size-3" />
                          Chưa có GPLX
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 shrink-0 w-[100px]">
                      <StatusBadge
                        variant={clinicStatusVariant(clinic.status)}
                        label={clinicStatusLabel(clinic.status)}
                        className="whitespace-nowrap"
                      />
                      {clinic.rejectedReason && (
                        <p className="mt-1 max-w-[100px] truncate text-[10px] text-po-text-muted">
                          Lý do: {clinic.rejectedReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-po-text-muted whitespace-nowrap shrink-0 w-[90px]">
                      {formatDate(clinic.createdAt)}
                    </td>
                    <td className="px-5 py-4 shrink-0 w-[200px]">
                      <div className="flex flex-wrap gap-1.5 sm:flex-row sm:items-center sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailClinic(clinic)}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 h-9 rounded-2xl px-3 text-xs font-semibold bg-po-surface-muted text-po-text ring-1 ring-po-border/70 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                          title="Xem chi tiết"
                        >
                          <Eye className="size-3.5" />
                          Chi tiết
                        </button>

                        {clinic.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setApproveTarget(clinic)}
                              disabled={approveMutation.isPending}
                              className="inline-flex shrink-0 items-center justify-center gap-1.5 h-9 rounded-2xl px-3 text-xs font-semibold bg-po-success-soft text-po-success transition hover:-translate-y-0.5 hover:bg-po-success hover:text-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Duyệt phòng khám"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Duyệt
                            </button>

                            <button
                              type="button"
                              onClick={() => setRejectTarget(clinic)}
                              disabled={rejectMutation.isPending}
                              className="inline-flex shrink-0 items-center justify-center gap-1.5 h-9 rounded-2xl px-3 text-xs font-semibold bg-po-danger-soft text-po-danger transition hover:-translate-y-0.5 hover:bg-po-danger hover:text-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Từ chối phòng khám"
                            >
                              <XCircle className="size-3.5" />
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-po-border/60 px-5 py-4">
            <p className="text-xs text-po-text-muted">
              Trang {meta?.pageNumber ?? page} / {totalPages} — {meta?.totalRecords ?? 0} kết quả
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-white px-4 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`inline-flex size-9 items-center justify-center rounded-2xl text-xs font-semibold transition ${
                      page === pageNum
                        ? "bg-po-primary text-white shadow-md"
                        : "bg-white text-po-text-muted ring-1 ring-po-border/80 hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-white px-4 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => {
          if (!approveTarget) return
          approveMutation.mutate(approveTarget.clinicId)
        }}
        title="Duyệt phòng khám?"
        description={`Bạn chắc chắn muốn duyệt phòng khám "${approveTarget?.clinicName}"? Phòng khám sẽ được phép hoạt động trên hệ thống.`}
        confirmLabel="Duyệt"
        variant="primary"
        isLoading={approveMutation.isPending}
      />

      <RejectDialog
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) return
          rejectMutation.mutate({ clinicId: rejectTarget.clinicId, reason })
        }}
        title="Từ chối phòng khám?"
        description={`Bạn muốn từ chối phòng khám "${rejectTarget?.clinicName}". Vui lòng nhập lý do từ chối.`}
        confirmLabel="Từ chối"
        isLoading={rejectMutation.isPending}
      />

      <ClinicDetailModal
        clinic={detailClinic}
        onClose={() => setDetailClinic(null)}
        onPreviewLicense={(clinic) => setLicensePreviewClinic(clinic)}
      />

      <LicenseImageModal
        clinic={licensePreviewClinic}
        onClose={() => setLicensePreviewClinic(null)}
      />
    </div>
  )
}

function ClinicMobileCard({
  clinic,
  isApprovePending,
  isRejectPending,
  onDetail,
  onApprove,
  onReject,
  onPreviewLicense,
}: {
  clinic: ClinicListItemResponse
  isApprovePending: boolean
  isRejectPending: boolean
  onDetail: () => void
  onApprove: () => void
  onReject: () => void
  onPreviewLicense: () => void
}) {
  return (
    <article className="rounded-[24px] bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-extrabold text-po-primary ring-1 ring-po-border/80">
          {clinic.clinicName[0]?.toUpperCase() ?? "C"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-po-text">
                {clinic.clinicName}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-po-text-muted">
                {clinic.address ?? "Chưa có địa chỉ"}
              </p>
            </div>
            <StatusBadge
              variant={clinicStatusVariant(clinic.status)}
              label={clinicStatusLabel(clinic.status)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-white/70 p-3 text-xs text-po-text-muted ring-1 ring-po-border/60">
        <span>Email: {clinic.email ?? "Chưa có"}</span>
        <span>Điện thoại: {clinic.phone ?? "Chưa có"}</span>
        <span>Số giấy phép: {clinic.licenseNumber ?? "Chưa có"}</span>
        <span>Ngày đăng ký: {formatDate(clinic.createdAt)}</span>
        {clinic.rejectedReason ? <span>Lý do: {clinic.rejectedReason}</span> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDetail}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          <Eye className="size-3.5" />
          Chi tiết
        </button>

        {clinic.licenseImageUrl ? (
          <button
            type="button"
            onClick={onPreviewLicense}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-po-primary-soft px-3 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white"
          >
            <Eye className="size-3.5" />
            Ảnh phép
          </button>
        ) : null}

        {clinic.status === "Pending" ? (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={isApprovePending}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-po-success-soft px-3 text-xs font-semibold text-po-success transition hover:-translate-y-0.5 hover:bg-po-success hover:text-white disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" />
              Duyệt
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={isRejectPending}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-po-danger-soft px-3 text-xs font-semibold text-po-danger transition hover:-translate-y-0.5 hover:bg-po-danger hover:text-white disabled:opacity-50"
            >
              <XCircle className="size-3.5" />
              Từ chối
            </button>
          </>
        ) : null}
      </div>
    </article>
  )
}

function ClinicDetailModal({
  clinic,
  onClose,
  onPreviewLicense,
}: {
  clinic: ClinicListItemResponse | null
  onClose: () => void
  onPreviewLicense: (clinic: ClinicListItemResponse) => void
}) {
  if (!clinic) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-po-text/45 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-orange-950/20 ring-1 ring-po-border/80"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-po-border/70 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
              Chi tiết hồ sơ phòng khám
            </p>
            <h3 className="mt-1 truncate text-2xl font-extrabold text-po-text">
              {clinic.clinicName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-surface-muted text-po-text-muted transition hover:bg-po-border/50 hover:text-po-text"
            aria-label="Đóng chi tiết phòng khám"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[calc(88vh-96px)] overflow-y-auto p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div className="rounded-3xl bg-po-surface-muted/70 p-5 ring-1 ring-po-border/70">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
                  <BadgeCheck className="size-5" />
                </span>
                <div>
                  <StatusBadge
                    variant={clinicStatusVariant(clinic.status)}
                    label={clinicStatusLabel(clinic.status)}
                  />
                  <p className="mt-2 text-xs text-po-text-muted">
                    Ngày đăng ký: {formatDate(clinic.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <DetailInfo label="Email" value={clinic.email ?? "Chưa có"} />
                <DetailInfo label="Điện thoại" value={clinic.phone ?? "Chưa có"} />
                <DetailInfo label="Số giấy phép" value={clinic.licenseNumber ?? "Chưa có"} />
                <DetailInfo label="Trạng thái" value={clinicStatusLabel(clinic.status)} />
              </div>

              <div className="mt-4">
                <DetailInfo label="Địa chỉ" value={clinic.address ?? "Chưa có địa chỉ"} />
              </div>

              {clinic.rejectedReason ? (
                <p className="mt-5 rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
                  Lý do từ chối: {clinic.rejectedReason}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl bg-white p-4 ring-1 ring-po-border/80">
              <p className="text-sm font-extrabold text-po-text">Ảnh giấy phép</p>
              {clinic.licenseImageUrl ? (
                <button
                  type="button"
                  onClick={() => onPreviewLicense(clinic)}
                  className="mt-3 block w-full overflow-hidden rounded-2xl bg-po-surface-muted text-left ring-1 ring-po-border/70 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <img
                    src={clinic.licenseImageUrl}
                    alt={`Giấy phép phòng khám ${clinic.clinicName}`}
                    className="h-48 w-full object-cover"
                  />
                  <span className="flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold text-po-primary">
                    <Eye className="size-3.5" />
                    Xem ảnh lớn
                  </span>
                </button>
              ) : (
                <div className="mt-3 rounded-2xl bg-po-surface-muted px-4 py-8 text-center text-sm font-semibold text-po-text-muted">
                  Chưa có ảnh giấy phép
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function LicenseImageModal({
  clinic,
  onClose,
}: {
  clinic: ClinicListItemResponse | null
  onClose: () => void
}) {
  if (!clinic?.licenseImageUrl) return null

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-po-text/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="w-full max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-orange-950/25 ring-1 ring-po-border/80"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-po-border/70 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
              Ảnh giấy phép
            </p>
            <h3 className="truncate text-lg font-extrabold text-po-text">{clinic.clinicName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-surface-muted text-po-text-muted transition hover:bg-po-border/50 hover:text-po-text"
            aria-label="Đóng ảnh giấy phép"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="bg-po-surface-muted/60 p-4">
          <img
            src={clinic.licenseImageUrl}
            alt={`Giấy phép phòng khám ${clinic.clinicName}`}
            className="mx-auto max-h-[72vh] w-auto rounded-2xl bg-white object-contain shadow-sm ring-1 ring-po-border/80"
          />
        </div>
      </section>
    </div>
  )
}

function DetailInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-po-text-subtle">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-po-text">{value}</p>
    </div>
  )
}

