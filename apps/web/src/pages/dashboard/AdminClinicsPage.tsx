import { useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Eye,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import RejectDialog from "@/components/ui/RejectDialog"
import ClinicDetailDrawer from "@/components/clinic/ClinicDetailDrawer"
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

export default function AdminClinicsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Pending")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [approveTarget, setApproveTarget] = useState<ClinicListItemResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ClinicListItemResponse | null>(null)
  const [detailClinic, setDetailClinic] = useState<ClinicListItemResponse | null>(null)

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
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
            Admin clinic management
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
            Duyệt phòng khám
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-po-text-muted">
            Xem xét, duyệt hoặc từ chối yêu cầu đăng ký phòng khám thú y. Kiểm tra giấy phép và
            thông tin trước khi chấp nhận.
          </p>

          <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            <HeroMetric
              label="Chờ duyệt"
              value={String(
                statusFilter === "Pending" ? meta?.totalRecords ?? 0 : items.filter((c) => c.status === "Pending").length,
              )}
              variant="warning"
            />
            <HeroMetric
              label="Đã duyệt"
              value={String(
                statusFilter === "Approved" ? meta?.totalRecords ?? 0 : items.filter((c) => c.status === "Approved").length,
              )}
              variant="success"
            />
            <HeroMetric
              label="Từ chối"
              value={String(
                statusFilter === "Rejected" ? meta?.totalRecords ?? 0 : items.filter((c) => c.status === "Rejected").length,
              )}
              variant="danger"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-white ring-1 ring-po-border/80 p-1 gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
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

      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-po-border/60">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Phòng khám
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Liên hệ
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Giấy phép
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Ngày đăng ký
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
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
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-po-primary-soft text-po-primary text-sm font-bold">
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
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {clinic.email && (
                          <p className="text-xs text-po-text-muted truncate max-w-[160px]">
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
                    <td className="px-5 py-4">
                      {clinic.licenseNumber ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-po-success text-xs">
                            <BadgeCheck className="size-3" />
                            {clinic.licenseNumber}
                          </span>
                          {clinic.licenseImageUrl && (
                            <a
                              href={clinic.licenseImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-po-primary text-xs hover:underline"
                            >
                              <Eye className="size-3" />
                              Xem ảnh
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-po-warning text-xs">
                          <AlertCircle className="size-3" />
                          Chưa có GPLX
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        variant={
                          clinic.status === "Approved"
                            ? "success"
                            : clinic.status === "Rejected"
                              ? "danger"
                              : "warning"
                        }
                        label={
                          clinic.status === "Approved"
                            ? "Đã duyệt"
                            : clinic.status === "Rejected"
                              ? "Từ chối"
                              : "Chờ duyệt"
                        }
                      />
                      {clinic.rejectedReason && (
                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-po-text-muted">
                          Lý do: {clinic.rejectedReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-po-text-muted whitespace-nowrap">
                      {formatDate(clinic.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setDetailClinic(clinic)}
                          className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-surface-muted text-po-text transition hover:-translate-y-0.5 hover:bg-po-border/30"
                          title="Xem chi tiết"
                        >
                          <Eye className="size-3.5" />
                          Chi tiết
                        </button>

                        {clinic.status === "Pending" && (
                          <>
                            <button
                              onClick={() => setApproveTarget(clinic)}
                              disabled={approveMutation.isPending}
                              className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-success-soft text-po-success transition hover:-translate-y-0.5 hover:bg-po-success hover:text-white"
                              title="Duyệt phòng khám"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Duyệt
                            </button>

                            <button
                              onClick={() => setRejectTarget(clinic)}
                              disabled={rejectMutation.isPending}
                              className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-danger-soft text-po-danger transition hover:-translate-y-0.5 hover:bg-po-danger hover:text-white"
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
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className={`inline-flex size-9 items-center justify-center rounded-full text-xs font-semibold transition ${
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
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
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

      <ClinicDetailDrawer
        clinic={detailClinic}
        onClose={() => setDetailClinic(null)}
      />
    </div>
  )
}

function HeroMetric({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant?: "warning" | "success" | "danger"
}) {
  const colorMap = {
    warning: "text-po-warning",
    success: "text-po-success",
    danger: "text-po-danger",
  }

  return (
    <div className="rounded-2xl bg-po-surface-muted/75 p-4 ring-1 ring-po-border/70">
      <p className={`text-2xl font-extrabold tabular-nums ${variant ? colorMap[variant] : "text-po-text"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-po-text-muted">{label}</p>
    </div>
  )
}

