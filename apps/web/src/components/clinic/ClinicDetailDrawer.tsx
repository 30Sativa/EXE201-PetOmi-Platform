import { FileText, X } from "lucide-react"

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

function isPdfUrl(url?: string | null) {
  return Boolean(url?.toLowerCase().includes(".pdf"))
}

function hasLicenseFile(clinic: ClinicListItemResponse) {
  return Boolean(clinic.hasLicenseFile || clinic.licenseImageUrl)
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
            <h2 className="text-lg font-extrabold text-po-text">Chi tiet phong kham</h2>
            <p className="mt-0.5 text-xs text-po-text-muted">
              Thong tin chi tiet cua phong kham
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
            aria-label="Dong"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 p-5">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
              Thong tin co ban
            </h3>
            <div className="space-y-3 rounded-2xl bg-po-surface-muted/50 p-4">
              <InfoRow label="Ten phong kham" value={clinic.clinicName} />
              <InfoRow label="Email" value={clinic.email ?? "Chua co"} />
              <InfoRow label="So dien thoai" value={clinic.phone ?? "Chua co"} />
              <InfoRow label="Dia chi" value={clinic.address ?? "Chua co"} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-po-text-subtle">Trang thai</span>
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
                      ? "Da duyet"
                      : clinic.status === "Rejected"
                        ? "Tu choi"
                        : "Cho duyet"
                  }
                />
              </div>
              <InfoRow label="Ngay dang ky" value={formatDate(clinic.createdAt)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
              Giay phep hoat dong
            </h3>
            <div className="space-y-3 rounded-2xl bg-po-surface-muted/50 p-4">
              <InfoRow
                label="File giay phep"
                value={hasLicenseFile(clinic) ? "Da gui" : "Chua co"}
              />
              {clinic.licenseImageUrl ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-po-text-subtle">
                    File giay phep
                  </span>
                  <a
                    href={clinic.licenseImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-po-border/60 transition hover:opacity-80"
                  >
                    {isPdfUrl(clinic.licenseImageUrl) ? (
                      <span className="flex h-48 w-full flex-col items-center justify-center gap-2 bg-white text-po-primary">
                        <FileText className="size-8" />
                        <span className="text-xs font-semibold">Mo PDF giay phep</span>
                      </span>
                    ) : (
                      <img
                        src={clinic.licenseImageUrl}
                        alt="Giay phep phong kham"
                        className="h-48 w-full object-cover"
                      />
                    )}
                  </a>
                </div>
              ) : (
                <p className="text-sm italic text-po-text-muted">Chua co file giay phep</p>
              )}
            </div>
          </section>

          {clinic.rejectedReason && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                Ly do tu choi
              </h3>
              <div className="rounded-2xl border border-po-danger/20 bg-po-danger-soft/30 p-4">
                <p className="text-sm text-po-danger">{clinic.rejectedReason}</p>
              </div>
            </section>
          )}
        </div>

        <div className="border-t border-po-border/60 p-5">
          <button
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-po-surface-muted text-sm font-semibold text-po-text transition hover:bg-po-border/30"
          >
            Dong
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
      <span className="text-right text-sm font-medium text-po-text">{value}</span>
    </div>
  )
}
