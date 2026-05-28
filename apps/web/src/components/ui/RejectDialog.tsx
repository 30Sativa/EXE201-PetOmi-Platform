import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface RejectDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  title: string
  description?: string
  confirmLabel?: string
  isLoading?: boolean
}

export default function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Từ chối",
  isLoading = false,
}: RejectDialogProps) {
  const [reason, setReason] = useState("")
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    if (isLoading || isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setReason("")
      onClose()
    }, 150)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const handleConfirm = () => {
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={handleBackdropClick}
    >
      <div className="m-auto w-[min(480px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-po-danger-soft text-po-danger">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-po-text">{title}</h3>
              {description && (
                <p className="mt-1.5 text-sm text-po-text-muted">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-semibold text-po-text mb-2">
            Lý do từ chối <span className="text-po-danger">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Giấy phép không hợp lệ, thông tin không chính xác..."
            rows={4}
            className={cn(
              "w-full resize-none rounded-2xl border border-po-border bg-po-surface-muted/40 p-3 text-sm text-po-text",
              "placeholder:text-po-text-muted/70",
              "focus:outline-none focus:ring-2 focus:ring-po-danger/40",
              "transition",
            )}
          />
          <p className="mt-1.5 text-xs text-po-text-muted">
            Vui lòng nhập lý do từ chối để chủ phòng khám biết.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="inline-flex h-10 items-center rounded-full border border-po-border bg-white px-5 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="inline-flex h-10 items-center rounded-full bg-po-danger px-5 text-sm font-semibold text-white transition hover:bg-po-danger/90 disabled:opacity-60"
          >
            {isLoading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

