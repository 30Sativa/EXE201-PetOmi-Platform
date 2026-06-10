import { useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, ClipboardList, Link2Off, ReceiptText, type LucideIcon } from "lucide-react"
import { toast } from "sonner"

import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { sePayReconciliationStatusLabel } from "@/lib/clinicDisplay"
import { formatCurrency, formatDate, formatShortId } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import {
  dismissSePayApi,
  getReconciliationApi,
  manualMatchSePayApi,
} from "@/services/clinic-billing.service"
import type { SePayReconciliationItemResponse } from "@/types"

type Filter = "pending" | "all"
type MatchTarget = SePayReconciliationItemResponse | null
type DismissTarget = SePayReconciliationItemResponse | null

const compactNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)

const formatCompactCurrency = (value?: number | null) => {
  const amount = value ?? 0
  const absolute = Math.abs(amount)
  if (absolute >= 1_000_000_000) return `${compactNumber(amount / 1_000_000_000)} tỷ`
  if (absolute >= 1_000_000) return `${compactNumber(amount / 1_000_000)} triệu`
  if (absolute >= 100_000) return `${compactNumber(amount / 1_000)} nghìn`
  return formatCurrency(amount)
}

export default function ClinicReconciliationPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [filter, setFilter] = useState<Filter>("pending")
  const [alertAfterMinutes, setAlertAfterMinutes] = useState("15")
  const [matchTarget, setMatchTarget] = useState<MatchTarget>(null)
  const [dismissTarget, setDismissTarget] = useState<DismissTarget>(null)
  const [invoiceId, setInvoiceId] = useState("")
  const [reviewNote, setReviewNote] = useState("")

  const reconciliationQuery = useQuery({
    queryKey: ["clinic", clinicId, "reconciliation", filter, alertAfterMinutes],
    queryFn: () =>
      getReconciliationApi({
        clinicId,
        limit: 50,
        includeMatched: filter === "all",
        alertAfterMinutes: Number(alertAfterMinutes) || 15,
      }),
    enabled: Boolean(clinicId),
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "reconciliation"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "dashboard-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "invoice-by-appointment"] }),
    ])
  }

  const matchMutation = useMutation({
    mutationFn: () => {
      if (!matchTarget) return Promise.reject(new Error("Chưa chọn giao dịch."))
      return manualMatchSePayApi(clinicId, matchTarget.paymentTransactionId, {
        invoiceId: invoiceId.trim(),
        reviewNote: reviewNote.trim() || null,
      })
    },
    onSuccess: async () => {
      toast.success("Đã khớp giao dịch SePay.")
      setMatchTarget(null)
      setInvoiceId("")
      setReviewNote("")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể khớp giao dịch.")),
  })

  const dismissMutation = useMutation({
    mutationFn: () => {
      if (!dismissTarget) return Promise.reject(new Error("Chưa chọn giao dịch."))
      return dismissSePayApi(clinicId, dismissTarget.paymentTransactionId, {
        reviewNote: reviewNote.trim(),
      })
    },
    onSuccess: async () => {
      toast.success("Đã bỏ qua giao dịch.")
      setDismissTarget(null)
      setReviewNote("")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể bỏ qua giao dịch.")),
  })

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={ClipboardList} title="Chưa có phòng khám" description="Bạn cần có hồ sơ phòng khám trước khi đối soát SePay." />
  }

  const items = reconciliationQuery.data ?? []
  const needsAttentionCount = items.filter((item) => item.needsAttention).length
  const unmatchedCount = items.filter((item) => !item.invoiceId).length
  const totalTransfer = items.reduce((sum, item) => sum + item.transferAmount, 0)

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[26px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              SePay reconciliation
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight text-po-text">
              Đối soát giao dịch
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-po-text-muted">
              Kiểm tra chuyển khoản, khớp hóa đơn hoặc bỏ qua giao dịch không hợp lệ.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[430px]">
            <MetricCard label="Tổng tiền xem" value={formatCompactCurrency(totalTransfer)} icon={ReceiptText} tone="info" />
            <MetricCard label="Cần chú ý" value={String(needsAttentionCount)} icon={AlertTriangle} tone="danger" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
        <div className="grid gap-3 border-b border-po-border/80 px-4 py-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">Danh sách giao dịch</h3>
              <p className="mt-1 text-xs text-po-text-muted">{items.length} giao dịch · {unmatchedCount} chưa khớp hóa đơn.</p>
            </div>
            <label className="grid w-36 gap-1.5 text-xs font-bold text-po-text">
              Cảnh báo sau
              <span className="relative">
                <input
                  value={alertAfterMinutes}
                  onChange={(event) => setAlertAfterMinutes(event.target.value)}
                  className="h-10 w-full rounded-2xl border border-po-border bg-white px-3 pr-12 text-sm font-medium text-po-text outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-po-text-subtle">phút</span>
              </span>
            </label>
          </div>

          <TabFilter
            tabs={[
              { value: "pending", label: "Đang chờ" },
              { value: "all", label: "Tất cả" },
            ]}
            activeTab={filter}
            onChange={setFilter}
          />
        </div>

        <div className="max-h-[calc(100dvh-330px)] min-h-[400px] overflow-y-auto p-4">
          {reconciliationQuery.isLoading ? (
            <ReconciliationSkeleton />
          ) : items.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Không có giao dịch cần xử lý" description="Các giao dịch SePay mới sẽ xuất hiện tại đây." className="py-14" />
          ) : (
            <div className="grid gap-3">
              {items.map((item) => (
                <ReconciliationRow
                  key={item.paymentTransactionId}
                  item={item}
                  onMatch={() => {
                    setMatchTarget(item)
                    setInvoiceId(item.invoiceId ?? "")
                    setReviewNote("")
                  }}
                  onDismiss={() => {
                    setDismissTarget(item)
                    setReviewNote("")
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {matchTarget ? (
        <Modal title="Khớp giao dịch" onClose={() => setMatchTarget(null)}>
          <p className="text-sm text-po-text-muted">{formatCurrency(matchTarget.transferAmount)} · {matchTarget.referenceCode ?? formatShortId(matchTarget.paymentTransactionId)}</p>
          <div className="mt-4 grid gap-4">
            <Input label="Mã hóa đơn nội bộ" value={invoiceId} onChange={setInvoiceId} />
            <Textarea label="Ghi chú rà soát" value={reviewNote} onChange={setReviewNote} />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setMatchTarget(null)} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">Hủy</button>
            <button
              onClick={() => matchMutation.mutate()}
              disabled={!invoiceId.trim() || matchMutation.isPending}
              className="inline-flex h-10 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              {matchMutation.isPending ? "Đang khớp..." : "Khớp hóa đơn"}
            </button>
          </div>
        </Modal>
      ) : null}

      {dismissTarget ? (
        <Modal title="Bỏ qua giao dịch" onClose={() => setDismissTarget(null)}>
          <p className="text-sm text-po-text-muted">{formatCurrency(dismissTarget.transferAmount)} · {dismissTarget.referenceCode ?? formatShortId(dismissTarget.paymentTransactionId)}</p>
          <div className="mt-4">
            <Textarea label="Lý do bỏ qua" value={reviewNote} onChange={setReviewNote} />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setDismissTarget(null)} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">Hủy</button>
            <button
              onClick={() => dismissMutation.mutate()}
              disabled={!reviewNote.trim() || dismissMutation.isPending}
              className="inline-flex h-10 items-center rounded-full bg-po-danger px-5 text-sm font-semibold text-white transition hover:bg-po-danger/90 disabled:opacity-60"
            >
              {dismissMutation.isPending ? "Đang lưu..." : "Bỏ qua"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function statusVariant(item: SePayReconciliationItemResponse) {
  if (item.needsAttention) return "danger"
  if (item.invoiceId) return "success"
  return "warning"
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: "info" | "danger"
}) {
  const toneClass = {
    info: "bg-po-primary-soft text-po-primary",
    danger: "bg-po-danger-soft text-po-danger",
  }[tone]

  return (
    <div className="grid min-h-[76px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[22px] bg-po-surface-muted/60 p-3 ring-1 ring-po-border/70">
      <span className={`grid size-9 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-po-text-muted">{label}</p>
        <p className="mt-1 truncate text-lg font-extrabold leading-none text-po-text">{value}</p>
      </div>
    </div>
  )
}

function ReconciliationRow({
  item,
  onMatch,
  onDismiss,
}: {
  item: SePayReconciliationItemResponse
  onMatch: () => void
  onDismiss: () => void
}) {
  return (
    <article className="rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70 transition hover:bg-white hover:shadow-sm hover:shadow-orange-100/70">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-sm font-extrabold text-po-text">{item.referenceCode ?? item.providerTransactionId}</p>
            <StatusBadge variant={statusVariant(item)} label={sePayReconciliationStatusLabel(item.status)} />
            {item.needsAttention ? <StatusBadge variant="danger" label="Cần kiểm tra" /> : null}
          </div>
          <p className="mt-1 truncate text-xs font-medium text-po-text-muted">{item.transferContent ?? "Không có nội dung chuyển khoản"}</p>
          <p className="mt-2 text-xs font-semibold text-po-text-subtle">
            {formatDate(item.transactionDate, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            {" · "}
            chờ {item.pendingMinutes} phút
          </p>
          {item.reviewNote ? <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs text-po-text-muted ring-1 ring-po-border/70">{item.reviewNote}</p> : null}
        </div>

        <div className="grid gap-3 lg:min-w-56 lg:justify-items-end">
          <div className="text-left lg:text-right">
            <p className="text-lg font-extrabold text-po-text" title={formatCurrency(item.transferAmount)}>{formatCompactCurrency(item.transferAmount)}</p>
            <p className="mt-1 text-xs text-po-text-muted">
              {item.invoiceCode ? `${item.invoiceCode} · ${formatCompactCurrency(item.invoiceFinalAmount)}` : "Chưa gắn hóa đơn"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              onClick={onMatch}
              className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-bold text-po-primary transition hover:bg-po-primary hover:text-white active:translate-y-px"
            >
              Khớp thủ công
            </button>
            <button
              onClick={onDismiss}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-po-danger-soft px-4 text-xs font-bold text-po-danger transition hover:bg-po-danger hover:text-white active:translate-y-px"
            >
              <Link2Off className="size-3.5" />
              Bỏ qua
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function ReconciliationSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70">
          <div className="h-4 w-44 animate-pulse rounded-full bg-white" />
          <div className="mt-2 h-3 w-72 animate-pulse rounded-full bg-white" />
          <div className="mt-3 h-8 w-56 animate-pulse rounded-full bg-white" />
        </div>
      ))}
    </div>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-po-text">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-2xl border border-po-border bg-white px-3 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-po-text">
      {label}
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="resize-none rounded-2xl border border-po-border bg-white px-3 py-3 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="m-auto w-[min(500px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        <h3 className="text-lg font-extrabold text-po-text">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
