import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "primary" | "warning"
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  if (!isOpen) return null

  const buttonClass = cn(
    "inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold transition",
    variant === "danger"
      ? "bg-po-danger text-white hover:bg-po-danger/90 disabled:opacity-60"
      : variant === "warning"
        ? "bg-po-warning text-white hover:bg-po-warning/90 disabled:opacity-60"
        : "bg-po-primary text-white hover:bg-po-primary-hover disabled:opacity-60",
  )

  return (
    <dialog
      ref={dialogRef}
      className="m-0 w-[min(480px,100%-24px)] rounded-[28px] border border-po-border bg-white p-6 backdrop:bg-black/30"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-po-text">{title}</h3>
          {description && (
            <p className="mt-2 text-sm text-po-text-muted">{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="inline-flex h-10 items-center rounded-full border border-po-border bg-white px-5 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={buttonClass}
        >
          {isLoading ? "Đang xử lý..." : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
