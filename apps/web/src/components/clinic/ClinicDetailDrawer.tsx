import { X } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"
import type { ClinicListItemResponse } from "@/types"

interface ClinicDetailDrawerProps {
  clinic: ClinicListItemResponse | null
  onClose: () => void
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
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

export default function ClinicDetailDrawer({ clinic, onClose }: ClinicDetailDrawerProps) {
  if (!clinic) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/30 animate-dialog-in" />

      <aside className="relative z-10 flex w-[min(520px,100vw)] flex-col overflow-y-auto bg-white shadow-2xl shadow-black/30 animate-drawer-in">
        <div className="flex items-center justify-between gap-4 border-b border-po-border/60 p-5">
          <div>
            <h2 className="text-lg font-extrabold text-po-text">Chi tiết phòng khám</h2>
            <p className="mt-0.5 text-xs text-po-text-muted">
              Thông tin chi tiết của phòng khám
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 p-5">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
              Thông tin cơ bản
            </h3>
            <div className="rounded-2xl bg-po-surface-muted/50 p-4 space-y-3">
              <InfoRow label="Tên phòng khám" value={clinic.clinicName} />
              <InfoRow label="Email" value={clinic.email ?? "Chưa có"} />
              <InfoRow label="Số điện thoại" value={clinic.phone ?? "Chưa có"} />
              <InfoRow label="Địa chỉ" value={clinic.address ?? "Chưa có"} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-po-text-subtle">Trạng thái</span>
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
              </div>
              <InfoRow label="Ngày đăng ký" value={formatDate(clinic.createdAt)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
              Giấy phép hoạt động
            </h3>
            <div className="rounded-2xl bg-po-surface-muted/50 p-4 space-y-3">
              <InfoRow
                label="Số GPLX"
                value={clinic.licenseNumber ?? "Chưa có"}
              />
              {clinic.licenseImageUrl ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-po-text-subtle">
                    Ảnh giấy phép
                  </span>
                  <a
                    href={clinic.licenseImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-po-border/60 transition hover:opacity-80"
                  >
                    <img
                      src={clinic.licenseImageUrl}
                      alt="Giấy phép phòng khám"
                      className="h-48 w-full object-cover"
                    />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-po-text-muted italic">Chưa có ảnh giấy phép</p>
              )}
            </div>
          </section>

          {clinic.rejectedReason && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                Lý do từ chối
              </h3>
              <div className="rounded-2xl bg-po-danger-soft/30 border border-po-danger/20 p-4">
                <p className="text-sm text-po-danger">{clinic.rejectedReason}</p>
              </div>
            </section>
          )}
        </div>

        <div className="border-t border-po-border/60 p-5">
          <button
            onClick={onClose}
            className="w-full inline-flex h-11 items-center justify-center rounded-full bg-po-surface-muted text-sm font-semibold text-po-text transition hover:bg-po-border/30"
          >
            Đóng
          </button>
        </div>
      </aside>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-xs font-semibold text-po-text-subtle">{label}</span>
      <span className="text-sm font-medium text-po-text text-right">{value}</span>
    </div>
  )
}

