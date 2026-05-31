import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, ClipboardList, Link2Off } from "lucide-react"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import { useMyClinic } from "@/hooks/useClinicQueries"
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
      toast.success("Đã match giao dịch SePay.")
      setMatchTarget(null)
      setInvoiceId("")
      setReviewNote("")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể match giao dịch.")),
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
    return <EmptyState icon={ClipboardList} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi đối soát SePay." />
  }

  const items = reconciliationQuery.data ?? []
  const needsAttentionCount = items.filter((item) => item.needsAttention).length
  const unmatchedCount = items.filter((item) => !item.invoiceId).length

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Đối soát SePay</h2>
          <p className="mt-1 text-sm text-po-text-muted">Kiểm tra giao dịch chuyển khoản, match hóa đơn hoặc bỏ qua giao dịch không hợp lệ.</p>
        </div>
        <label className="grid w-44 gap-1.5 text-sm font-semibold text-po-text">
          Cảnh báo sau phút
          <input
            value={alertAfterMinutes}
            onChange={(event) => setAlertAfterMinutes(event.target.value)}
            className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Giao dịch đang xem" value={String(items.length)} />
        <Metric label="Cần chú ý" value={String(needsAttentionCount)} danger />
        <Metric label="Chưa match hóa đơn" value={String(unmatchedCount)} warning />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabFilter
          tabs={[
            { value: "pending", label: "Đang chờ" },
            { value: "all", label: "Tất cả" },
          ]}
          activeTab={filter}
          onChange={setFilter}
        />
        <p className="text-sm font-semibold text-po-text-muted">{items.length} giao dịch</p>
      </div>

      <DashboardSection title="Danh sách giao dịch" subtitle="Giao dịch không tự match được sẽ cần nhập InvoiceId để xử lý thủ công.">
        {reconciliationQuery.isLoading ? (
          <div className="py-12 text-center"><LoadingSpinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Không có giao dịch cần xử lý" description="Các giao dịch SePay mới sẽ xuất hiện tại đây." />
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.paymentTransactionId} className="rounded-2xl border border-po-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-po-text">{item.referenceCode ?? item.providerTransactionId}</p>
                      <StatusBadge variant={statusVariant(item)} label={item.status} />
                      {item.needsAttention ? <StatusBadge variant="danger" label="Cần kiểm tra" /> : null}
                    </div>
                    <p className="mt-1 text-xs text-po-text-muted">{item.transferContent ?? "Không có nội dung chuyển khoản"}</p>
                    <p className="mt-2 text-xs text-po-text-subtle">
                      {formatDate(item.transactionDate, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      chờ {item.pendingMinutes} phút
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-po-text">{formatCurrency(item.transferAmount)}</p>
                    <p className="text-xs text-po-text-muted">
                      {item.invoiceCode ? `${item.invoiceCode} · ${formatCurrency(item.invoiceFinalAmount)}` : "Chưa gắn hóa đơn"}
                    </p>
                  </div>
                </div>
                {item.reviewNote ? <p className="mt-3 rounded-2xl bg-po-surface-muted px-3 py-2 text-xs text-po-text-muted">{item.reviewNote}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setMatchTarget(item)
                      setInvoiceId(item.invoiceId ?? "")
                      setReviewNote("")
                    }}
                    className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:bg-po-primary hover:text-white"
                  >
                    Match thủ công
                  </button>
                  <button
                    onClick={() => {
                      setDismissTarget(item)
                      setReviewNote("")
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-po-danger-soft px-4 text-xs font-semibold text-po-danger transition hover:bg-po-danger hover:text-white"
                  >
                    <Link2Off className="size-3" />
                    Bỏ qua
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      {matchTarget ? (
        <Modal title="Match giao dịch" onClose={() => setMatchTarget(null)}>
          <p className="text-sm text-po-text-muted">{formatCurrency(matchTarget.transferAmount)} · {matchTarget.referenceCode ?? formatShortId(matchTarget.paymentTransactionId)}</p>
          <div className="mt-4 grid gap-4">
            <Input label="InvoiceId" value={invoiceId} onChange={setInvoiceId} />
            <Textarea label="Ghi chú review" value={reviewNote} onChange={setReviewNote} />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setMatchTarget(null)} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">Hủy</button>
            <button
              onClick={() => matchMutation.mutate()}
              disabled={!invoiceId.trim() || matchMutation.isPending}
              className="inline-flex h-10 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              {matchMutation.isPending ? "Đang match..." : "Match hóa đơn"}
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

function Metric({ label, value, danger, warning }: { label: string; value: string; danger?: boolean; warning?: boolean }) {
  return (
    <div className="rounded-[24px] border border-po-border bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex size-10 items-center justify-center rounded-2xl ${danger ? "bg-po-danger-soft text-po-danger" : warning ? "bg-po-warning-soft text-po-warning" : "bg-po-primary-soft text-po-primary"}`}>
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-sm font-semibold text-po-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-po-text">{value}</p>
    </div>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
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
  children: React.ReactNode
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
