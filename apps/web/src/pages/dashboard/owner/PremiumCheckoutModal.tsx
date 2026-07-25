import { AlertTriangle, CreditCard, Loader2, Tag, X } from "lucide-react"

import { formatCurrency } from "@/lib/format"

type PremiumCheckoutModalProps = {
  voucherCode: string
  isSubmitting: boolean
  errorMessage?: string
  onVoucherChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
}

export default function PremiumCheckoutModal({
  voucherCode,
  isSubmitting,
  errorMessage,
  onVoucherChange,
  onSubmit,
  onClose,
}: PremiumCheckoutModalProps) {
  const hasVoucher = Boolean(voucherCode.trim())

  const handleBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSubmitting) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 animate-dialog-in"
      onClick={handleBackdrop}
    >
      <form
        className="m-auto w-[min(440px,100%)] overflow-hidden rounded-3xl border border-po-border bg-white shadow-2xl shadow-black/20 animate-dialog-content-in"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-po-border/70 bg-po-surface-muted/50 px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-po-primary">
              Nâng cấp AI
            </p>
            <h3 className="mt-1 text-lg font-bold text-po-text">Xác nhận gói Premium</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="shrink-0 rounded-full p-1.5 text-po-text-muted transition hover:bg-white hover:text-po-text disabled:opacity-50"
            aria-label="Đóng xác nhận thanh toán"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-po-surface-muted/70 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-po-primary-soft text-po-primary">
                <CreditCard className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-po-text">Premium cho cả tài khoản</p>
                <p className="text-xs text-po-text-muted">500 tin nhắn mỗi tháng</p>
              </div>
            </div>
            <p className="shrink-0 text-lg font-extrabold text-po-text">{formatCurrency(99000)}</p>
          </div>

          <div>
            <label htmlFor="premium-voucher-code" className="flex items-center gap-2 text-sm font-bold text-po-text">
              <Tag className="size-4 text-po-primary" />
              Mã giảm giá <span className="font-medium text-po-text-muted">(nếu có)</span>
            </label>
            <input
              id="premium-voucher-code"
              value={voucherCode}
              onChange={(event) => onVoucherChange(event.target.value)}
              maxLength={40}
              autoComplete="off"
              placeholder="Ví dụ: PETOMI50"
              className="mt-2 h-11 w-full rounded-xl border border-po-border bg-white px-3 text-sm font-bold uppercase text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/15"
            />
            <p className="mt-2 text-xs leading-5 text-po-text-muted">
              Mã được kiểm tra trước khi tạo QR. Nếu hợp lệ, QR sẽ tự dùng số tiền đã giảm.
            </p>
          </div>

          {errorMessage ? (
            <div className="flex gap-3 rounded-2xl border border-po-danger/25 bg-po-danger-soft px-4 py-3 text-sm text-po-danger">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p className="font-semibold leading-5">{errorMessage}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-po-primary px-4 text-sm font-bold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            {isSubmitting
              ? "Đang tạo mã thanh toán"
              : hasVoucher
                ? "Áp dụng mã và tạo QR"
                : "Tạo mã QR thanh toán"}
          </button>
        </div>
      </form>
    </div>
  )
}
