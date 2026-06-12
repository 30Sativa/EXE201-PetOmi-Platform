import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Activity,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  PackageSearch,
  Plus,
  QrCode,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/ui/ConfirmDialog"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { appointmentStatusLabel, appointmentTypeLabel, invoiceSourceLabel, invoiceStatusLabel } from "@/lib/clinicDisplay"
import { formatCurrency, formatDate, formatShortId, formatTime, todayDateInput, toDateInputValue } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import {
  autoComposeInvoiceApi,
  cancelInvoiceApi,
  confirmManualRefundApi,
  createOrderApi,
  getSePayPaymentStatusApi,
  getBillingRevenueTrendApi,
  getBillingSummaryApi,
  getInvoiceByAppointmentApi,
  getPendingManualRefundsApi,
  getReconciliationApi,
  getUnpaidAgingApi,
  payInvoiceApi,
  requestSePayPaymentApi,
} from "@/services/clinic-billing.service"
import { getClinicAppointmentsApi } from "@/services/clinic-appointments.service"
import { getInventoryApi } from "@/services/clinic.service"
import type {
  AppointmentListItemResponse,
  InvoiceAgingItemResponse,
  InvoiceResponse,
  PendingManualRefundItemResponse,
  SePayPaymentRequestResponse,
  SePayPaymentStatusResponse,
  SePayReconciliationItemResponse,
} from "@/types"

const today = todayDateInput()
const sevenDaysAgo = toDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))

type RetailCartItem = {
  inventoryItemId: string
  itemName: string
  quantity: number
  unitPrice: number
  availableQuantity: number
}

type BillingConfirmTarget =
  | { type: "pay"; invoice: InvoiceResponse; method: "Cash" | "BankTransfer"; methodLabel: string }
  | { type: "sepay"; invoice: InvoiceResponse }
  | { type: "cancel"; invoice: InvoiceResponse }
  | { type: "remove-cart"; item: RetailCartItem }

const appointmentStatusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "CheckedIn", label: "Đã check-in" },
  { value: "Completed", label: "Hoàn tất" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "NoShow", label: "Không đến" },
]

type BillingWorkspace = "checkout" | "monitor"

export default function ClinicBillingPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [fromDate, setFromDate] = useState(sevenDaysAgo)
  const [toDate, setToDate] = useState(today)
  const [appointmentDate, setAppointmentDate] = useState(today)
  const [appointmentStatus, setAppointmentStatus] = useState("all")
  const [appointmentSearch, setAppointmentSearch] = useState("")
  const debouncedAppointmentSearch = useDebouncedValue(appointmentSearch.trim(), 300)
  const [appointmentDraftId, setAppointmentDraftId] = useState("")
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("")
  const [discountAmount, setDiscountAmount] = useState("0")
  const [refundTarget, setRefundTarget] = useState<PendingManualRefundItemResponse | null>(null)
  const [refundNote, setRefundNote] = useState("")
  const [qrRequest, setQrRequest] = useState<SePayPaymentRequestResponse | null>(null)
  const [selectedInventoryId, setSelectedInventoryId] = useState("")
  const [retailQuantity, setRetailQuantity] = useState("1")
  const [retailDiscountAmount, setRetailDiscountAmount] = useState("0")
  const [retailCart, setRetailCart] = useState<RetailCartItem[]>([])
  const [retailInvoice, setRetailInvoice] = useState<InvoiceResponse | null>(null)
  const [workspace, setWorkspace] = useState<BillingWorkspace>("checkout")
  const [confirmTarget, setConfirmTarget] = useState<BillingConfirmTarget | null>(null)
  const settledSePayInvoiceIdsRef = useRef(new Set<string>())

  const summaryQuery = useQuery({
    queryKey: ["clinic", clinicId, "dashboard-summary"],
    queryFn: () => getBillingSummaryApi(clinicId),
    enabled: Boolean(clinicId),
  })

  const trendQuery = useQuery({
    queryKey: ["clinic", clinicId, "revenue-trend", fromDate, toDate],
    queryFn: () => getBillingRevenueTrendApi({ clinicId, fromDate, toDate }),
    enabled: Boolean(clinicId),
  })

  const unpaidQuery = useQuery({
    queryKey: ["clinic", clinicId, "unpaid-aging"],
    queryFn: () => getUnpaidAgingApi({ clinicId, page: 1, pageSize: 20 }),
    enabled: Boolean(clinicId),
  })

  const refundsQuery = useQuery({
    queryKey: ["clinic", clinicId, "manual-refunds"],
    queryFn: () => getPendingManualRefundsApi({ clinicId, page: 1, pageSize: 20 }),
    enabled: Boolean(clinicId),
  })

  const paymentHistoryQuery = useQuery({
    queryKey: ["clinic", clinicId, "payment-history"],
    queryFn: () =>
      getReconciliationApi({
        clinicId,
        limit: 20,
        includeMatched: true,
        alertAfterMinutes: 15,
      }),
    enabled: Boolean(clinicId),
  })

  const inventoryQuery = useQuery({
    queryKey: ["clinic", clinicId, "inventory"],
    queryFn: () => getInventoryApi(clinicId),
    enabled: Boolean(clinicId),
  })

  const billingAppointmentsQuery = useQuery({
    queryKey: ["clinic", clinicId, "billing-appointments", appointmentDate, appointmentStatus, debouncedAppointmentSearch],
    queryFn: () =>
      getClinicAppointmentsApi({
        clinicId,
        status: appointmentStatus === "all" ? undefined : appointmentStatus,
        date: appointmentDate || undefined,
        search: debouncedAppointmentSearch || undefined,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(clinicId),
  })

  const invoiceQuery = useQuery({
    queryKey: ["clinic", clinicId, "invoice-by-appointment", selectedAppointmentId],
    queryFn: () => getInvoiceByAppointmentApi(clinicId, selectedAppointmentId),
    enabled: Boolean(clinicId && selectedAppointmentId),
  })

  const invalidateBilling = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "dashboard-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "unpaid-aging"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "manual-refunds"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "payment-history"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "revenue-trend"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "invoice-by-appointment"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "inventory"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "reconciliation"] }),
    ])
  }, [clinicId, queryClient])

  const markInvoicePaidLocally = useCallback((status: SePayPaymentStatusResponse) => {
    const paidAt = status.transactionDate ?? new Date().toISOString()
    const patchInvoice = (invoice: InvoiceResponse | null | undefined): InvoiceResponse | null | undefined => {
      if (!invoice || invoice.id !== status.invoiceId) return invoice

      return {
        ...invoice,
        status: "Paid",
        paymentProvider: "SePay",
        paymentMethod: "SePayBankTransfer",
        paymentReference: status.paymentReference ?? invoice.paymentReference,
        paidAmount: status.receivedAmount ?? status.paidAmount ?? status.finalAmount,
        paidAt,
        paymentWebhookAt: paidAt,
      }
    }

    queryClient.setQueriesData<InvoiceResponse | null>(
      { queryKey: ["clinic", clinicId, "invoice-by-appointment"] },
      (current) => patchInvoice(current) ?? null,
    )
    setRetailInvoice((current) => patchInvoice(current) ?? null)
  }, [clinicId, queryClient])

  const addRetailItem = () => {
    const inventoryItem = (inventoryQuery.data ?? []).find((item) => item.itemId === selectedInventoryId)
    if (!inventoryItem) {
      toast.error("Chọn mặt hàng trước khi thêm vào đơn.")
      return
    }

    const quantity = Math.max(1, Number(retailQuantity) || 1)
    if (quantity > inventoryItem.quantity) {
      toast.error(`Tồn kho không đủ. Hiện còn ${inventoryItem.quantity}.`)
      return
    }

    setRetailCart((current) => {
      const existed = current.find((item) => item.inventoryItemId === inventoryItem.itemId)
      if (existed) {
        const nextQuantity = existed.quantity + quantity
        if (nextQuantity > inventoryItem.quantity) {
          toast.error(`Tồn kho không đủ. Hiện còn ${inventoryItem.quantity}.`)
          return current
        }
        return current.map((item) =>
          item.inventoryItemId === inventoryItem.itemId
            ? { ...item, quantity: nextQuantity }
            : item,
        )
      }

      return [
        ...current,
        {
          inventoryItemId: inventoryItem.itemId,
          itemName: inventoryItem.itemName,
          quantity,
          unitPrice: inventoryItem.unitPrice ?? 0,
          availableQuantity: inventoryItem.quantity,
        },
      ]
    })
  }

  const autoComposeMutation = useMutation({
    mutationFn: () =>
      autoComposeInvoiceApi(clinicId, {
        appointmentId: selectedAppointmentId,
        discountAmount: Number(discountAmount) || 0,
        notes: "Auto-compose từ quầy thu ngân",
        includeService: true,
        includePrescriptions: true,
      }),
    onSuccess: async () => {
      toast.success("Đã tạo hóa đơn từ lịch hẹn.")
      await invalidateBilling()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo hóa đơn.")),
  })

  const createRetailInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (retailCart.length === 0) {
        throw new Error("Đơn bán hàng cần ít nhất 1 mặt hàng.")
      }

      const order = await createOrderApi({
        clinicId,
        orderType: "Retail",
        notes: "Bán hàng tại quầy",
        confirmImmediately: true,
        items: retailCart.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.itemName,
          sourceType: "Retail",
        })),
      })

      return autoComposeInvoiceApi(clinicId, {
        orderId: order.orderId,
        discountAmount: Number(retailDiscountAmount) || 0,
        notes: "Auto-compose từ đơn bán hàng tại quầy",
        includeService: false,
        includePrescriptions: false,
        includeOrderItems: true,
      })
    },
    onSuccess: async (invoice) => {
      toast.success("Đã tạo hóa đơn bán hàng tại quầy.")
      setRetailInvoice(invoice)
      setRetailCart([])
      await invalidateBilling()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo hóa đơn bán hàng.")),
  })

  const payMutation = useMutation({
    mutationFn: ({ invoice, method }: { invoice: InvoiceResponse; method: string }) =>
      payInvoiceApi(clinicId, invoice.id, { paymentMethod: method, paidAmount: invoice.finalAmount }),
    onSuccess: async () => {
      toast.success("Đã ghi nhận thanh toán.")
      setConfirmTarget(null)
      setRetailInvoice(null)
      await invalidateBilling()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể ghi nhận thanh toán.")),
  })

  const sePayMutation = useMutation({
    mutationFn: (invoice: InvoiceResponse) =>
      requestSePayPaymentApi(clinicId, invoice.id, { paymentReference: invoice.paymentReference }),
    onSuccess: async (data) => {
      setConfirmTarget(null)
      setQrRequest(data)
      toast.success("Đã tạo yêu cầu thanh toán SePay.")
      await invalidateBilling()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo QR SePay.")),
  })

  const qrStatusQuery = useQuery({
    queryKey: ["clinic", clinicId, "sepay-payment-status", qrRequest?.invoiceId],
    queryFn: () => getSePayPaymentStatusApi(clinicId, qrRequest!.invoiceId),
    enabled: Boolean(clinicId && qrRequest?.invoiceId),
    refetchInterval: (query) => {
      const status = query.state.data
      return qrRequest && !status?.isFinal ? 2000 : false
    },
  })

  useEffect(() => {
    const status = qrStatusQuery.data
    if (status?.status !== "Paid" || settledSePayInvoiceIdsRef.current.has(status.invoiceId)) {
      return
    }

    settledSePayInvoiceIdsRef.current.add(status.invoiceId)
    queueMicrotask(() => {
      markInvoicePaidLocally(status)
      toast.success(`Thanh toán ${status.invoiceCode} thành công.`, {
        description: `${formatCurrency(status.receivedAmount ?? status.finalAmount)} đã được ghi nhận qua SePay.`,
        icon: <CheckCircle2 className="size-4 text-po-success" />,
      })
      void invalidateBilling()
    })
  }, [invalidateBilling, markInvoicePaidLocally, qrStatusQuery.data])

  const cancelMutation = useMutation({
    mutationFn: (invoice: InvoiceResponse) =>
      cancelInvoiceApi(clinicId, invoice.id, { cancelReason: "Hủy từ quầy thu ngân clinic" }),
    onSuccess: async () => {
      toast.success("Đã hủy hóa đơn.")
      setConfirmTarget(null)
      await invalidateBilling()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể hủy hóa đơn.")),
  })

  const refundMutation = useMutation({
    mutationFn: () => {
      if (!refundTarget) return Promise.reject(new Error("Chưa chọn hóa đơn hoàn tiền."))
      return confirmManualRefundApi(clinicId, refundTarget.invoiceId, {
        refundNote: refundNote.trim(),
      })
    },
    onSuccess: async () => {
      toast.success("Đã xác nhận hoàn tiền thủ công.")
      setRefundTarget(null)
      setRefundNote("")
      await invalidateBilling()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể xác nhận hoàn tiền.")),
  })

  const handleConfirmBillingAction = () => {
    if (!confirmTarget) return

    switch (confirmTarget.type) {
      case "pay":
        payMutation.mutate({ invoice: confirmTarget.invoice, method: confirmTarget.method })
        break
      case "sepay":
        sePayMutation.mutate(confirmTarget.invoice)
        break
      case "cancel":
        cancelMutation.mutate(confirmTarget.invoice)
        break
      case "remove-cart":
        setRetailCart((current) =>
          current.filter((cartItem) => cartItem.inventoryItemId !== confirmTarget.item.inventoryItemId),
        )
        setConfirmTarget(null)
        break
    }
  }

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={ReceiptText} title="Chưa có phòng khám" description="Bạn cần có hồ sơ phòng khám trước khi mở quầy thu ngân." />
  }

  const summary = summaryQuery.data
  const invoice = invoiceQuery.data
  const points = trendQuery.data?.points ?? []
  const billingAppointments = billingAppointmentsQuery.data?.items ?? []

  const retailSubtotal = retailCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const retailTotal = Math.max(0, retailSubtotal - (Number(retailDiscountAmount) || 0))
  const unpaidItems = unpaidQuery.data ?? []
  const refundItems = refundsQuery.data ?? []
  const paymentHistoryItems = paymentHistoryQuery.data ?? []

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[26px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              Quầy thu ngân
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight text-po-text">
              Thu tiền, tạo hóa đơn và xử lý công nợ
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-po-text-muted">
              Tập trung thao tác hằng ngày, theo dõi hóa đơn và xử lý công nợ trong cùng một luồng.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 lg:justify-end">
            <div className="inline-flex h-11 rounded-full bg-po-surface-muted p-1 ring-1 ring-po-border/80">
              <WorkspaceButton active={workspace === "checkout"} icon={ReceiptText} label="Thu tiền" onClick={() => setWorkspace("checkout")} />
              <WorkspaceButton active={workspace === "monitor"} icon={Activity} label="Theo dõi" onClick={() => setWorkspace("monitor")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Từ ngày" type="date" value={fromDate} onChange={setFromDate} compact />
              <Input label="Đến ngày" type="date" value={toDate} onChange={setToDate} compact />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Doanh thu hôm nay" value={formatCurrency(summary?.todayPaidRevenue)} icon={Banknote} tone="success" compact />
        <MetricCard label="Hóa đơn chưa thu" value={String(summary?.unpaidInvoiceCount ?? 0)} hint={formatCurrency(summary?.totalUnpaidAmount)} icon={ReceiptText} tone="warning" compact />
        <MetricCard label="Cần đối soát" value={String(summary?.pendingReconciliationCount ?? 0)} icon={QrCode} tone="info" compact />
        <MetricCard label="Chờ hoàn tiền" value={String(summary?.pendingManualRefundCount ?? 0)} icon={RotateCcw} tone="danger" compact />
      </div>

      {workspace === "checkout" ? (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-h-0 overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
            <div className="flex items-center justify-between gap-3 border-b border-po-border/80 px-4 py-3">
              <div>
                <h3 className="text-base font-extrabold text-po-text">Thu tiền</h3>
                <p className="mt-1 text-xs text-po-text-muted">Tìm invoice theo lịch hẹn hoặc tạo hóa đơn bán lẻ.</p>
              </div>
            </div>

            <div className="grid gap-4 p-4">
              <article className="rounded-[22px] bg-po-surface-muted/45 p-4 ring-1 ring-po-border/70">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/70">
                    <Search className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-po-text">Hóa đơn lịch hẹn</h4>
                    <p className="text-xs font-medium text-po-text-muted">Auto-compose từ dịch vụ và toa thuốc trong buổi khám.</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-[170px_190px_minmax(0,1fr)]">
                  <Input label="Ngày hẹn" type="date" value={appointmentDate} onChange={(value) => {
                    setAppointmentDate(value)
                    setAppointmentDraftId("")
                    setSelectedAppointmentId("")
                  }} />
                  <AppointmentStatusSelect
                    value={appointmentStatus}
                    onChange={(value) => {
                      setAppointmentStatus(value)
                      setAppointmentDraftId("")
                      setSelectedAppointmentId("")
                    }}
                  />
                  <Input label="Tìm lịch hẹn" value={appointmentSearch} onChange={(value) => {
                    setAppointmentSearch(value)
                    setAppointmentDraftId("")
                  }} />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
                  <AppointmentSelect
                    value={appointmentDraftId}
                    appointments={billingAppointments}
                    isLoading={billingAppointmentsQuery.isLoading}
                    onChange={setAppointmentDraftId}
                  />
                  <Input label="Giảm giá" value={discountAmount} onChange={setDiscountAmount} />
                  <button
                    onClick={() => setSelectedAppointmentId(appointmentDraftId)}
                    disabled={!appointmentDraftId}
                    className="self-end inline-flex h-10 items-center justify-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:opacity-60 active:translate-y-0"
                  >
                    Mở hóa đơn
                  </button>
                </div>

                {selectedAppointmentId ? (
                  <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-po-border/70">
                    {invoiceQuery.isLoading ? (
                      <div className="py-8 text-center"><LoadingSpinner /></div>
                    ) : invoice ? (
                      <InvoiceCard
                        invoice={invoice}
                        onPayCash={() => setConfirmTarget({ type: "pay", invoice, method: "Cash", methodLabel: "tiền mặt" })}
                        onPayBank={() => setConfirmTarget({ type: "pay", invoice, method: "BankTransfer", methodLabel: "chuyển khoản" })}
                        onSePay={() => setConfirmTarget({ type: "sepay", invoice })}
                        onCancel={() => setConfirmTarget({ type: "cancel", invoice })}
                        busy={payMutation.isPending || sePayMutation.isPending || cancelMutation.isPending}
                      />
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-po-text">Chưa có hóa đơn</p>
                          <p className="mt-1 text-xs text-po-text-muted">Tạo nhanh từ dữ liệu buổi khám hiện tại.</p>
                        </div>
                        <button
                          onClick={() => autoComposeMutation.mutate()}
                          disabled={autoComposeMutation.isPending}
                          className="inline-flex h-10 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
                        >
                          {autoComposeMutation.isPending ? "Đang tạo..." : "Tạo hóa đơn"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </article>

              <article className="rounded-[22px] bg-po-surface-muted/45 p-4 ring-1 ring-po-border/70">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/70">
                    <ShoppingCart className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-po-text">Bán hàng tại quầy</h4>
                    <p className="text-xs font-medium text-po-text-muted">Thuốc, thức ăn hoặc phụ kiện không cần khám.</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_110px_auto]">
                  <label className="grid gap-1.5 text-xs font-bold text-po-text">
                    Mặt hàng trong kho
                    <select
                      value={selectedInventoryId}
                      onChange={(event) => setSelectedInventoryId(event.target.value)}
                      className="h-10 min-w-0 rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                    >
                      <option value="">Chọn thuốc / thức ăn / phụ kiện</option>
                      {(inventoryQuery.data ?? []).map((item) => (
                        <option key={item.itemId} value={item.itemId} disabled={!item.isActive || item.quantity <= 0}>
                          {item.itemName} · tồn {item.quantity} · {formatCurrency(item.unitPrice)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input label="Số lượng" value={retailQuantity} onChange={setRetailQuantity} />
                  <button
                    onClick={addRetailItem}
                    disabled={!selectedInventoryId || inventoryQuery.isLoading}
                    className="self-end inline-flex h-10 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:opacity-60 active:translate-y-0"
                  >
                    <Plus className="size-4" />
                    Thêm
                  </button>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-po-border/70">
                  {retailCart.length === 0 ? (
                    <EmptyState icon={PackageSearch} title="Chưa có mặt hàng" description="Chọn mặt hàng trong kho để tạo đơn bán hàng tại quầy." className="py-8" />
                  ) : (
                    retailCart.map((item) => (
                      <div key={item.inventoryItemId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-po-surface-muted px-4 py-3">
                        <div>
                          <p className="text-sm font-bold text-po-text">{item.itemName}</p>
                          <p className="text-xs text-po-text-muted">
                            Tồn {item.availableQuantity} · {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-extrabold text-po-text">{formatCurrency(item.quantity * item.unitPrice)}</p>
                          <button
                            onClick={() => setConfirmTarget({ type: "remove-cart", item })}
                            className="rounded-full p-2 text-po-danger transition hover:bg-po-danger-soft"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr_auto] md:items-end">
                  <Input label="Giảm giá" value={retailDiscountAmount} onChange={setRetailDiscountAmount} />
                  <div className="rounded-2xl bg-white px-4 py-2.5 ring-1 ring-po-border/70">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-po-text-subtle">Tạm tính</p>
                    <p className="mt-0.5 text-lg font-extrabold text-po-text">{formatCurrency(retailTotal)}</p>
                  </div>
                  <button
                    onClick={() => createRetailInvoiceMutation.mutate()}
                    disabled={retailCart.length === 0 || createRetailInvoiceMutation.isPending}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-po-success px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-success/90 disabled:opacity-60 active:translate-y-0"
                  >
                    {createRetailInvoiceMutation.isPending ? "Đang tạo..." : "Tạo hóa đơn"}
                  </button>
                </div>

                {retailInvoice ? (
                  <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-po-border/70">
                    <InvoiceCard
                      invoice={retailInvoice}
                      onPayCash={() => setConfirmTarget({ type: "pay", invoice: retailInvoice, method: "Cash", methodLabel: "tiền mặt" })}
                      onPayBank={() => setConfirmTarget({ type: "pay", invoice: retailInvoice, method: "BankTransfer", methodLabel: "chuyển khoản" })}
                      onSePay={() => setConfirmTarget({ type: "sepay", invoice: retailInvoice })}
                      onCancel={() => setConfirmTarget({ type: "cancel", invoice: retailInvoice })}
                      busy={payMutation.isPending || sePayMutation.isPending || cancelMutation.isPending}
                    />
                  </div>
                ) : null}
              </article>
            </div>
          </section>

          <BillingQueue
            unpaidItems={unpaidItems}
            refundItems={refundItems}
            isLoadingUnpaid={unpaidQuery.isLoading}
            isLoadingRefunds={refundsQuery.isLoading}
            onRefund={setRefundTarget}
          />
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-h-0 overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
            <div className="flex items-center justify-between gap-3 border-b border-po-border/80 px-4 py-3">
              <div>
                <h3 className="text-base font-extrabold text-po-text">Doanh thu theo ngày</h3>
                <p className="mt-1 text-xs text-po-text-muted">{formatDate(trendQuery.data?.fromDate)} - {formatDate(trendQuery.data?.toDate)}</p>
              </div>
              <StatusBadge variant="info" label={`${points.length} ngày`} />
            </div>
            <div className="p-4">
              {trendQuery.isLoading ? (
                <div className="py-12 text-center"><LoadingSpinner /></div>
              ) : points.length === 0 ? (
                <EmptyState icon={CreditCard} title="Chưa có doanh thu" description="Khoảng ngày này chưa ghi nhận hóa đơn đã thanh toán." className="py-8" />
              ) : (
                <div className="grid gap-2">
                  {points.map((point) => (
                    <div key={point.date} className="grid gap-3 rounded-2xl bg-po-surface-muted/60 p-4 sm:grid-cols-[150px_1fr_auto] sm:items-center">
                      <div>
                        <p className="text-sm font-bold text-po-text">{formatDate(point.date)}</p>
                        <p className="text-xs text-po-text-muted">{point.paidInvoiceCount} hóa đơn</p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-po-primary"
                          style={{ width: `${Math.min(100, (point.revenue / Math.max(1, trendQuery.data?.totalRevenue ?? 1)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-sm font-extrabold text-po-text">{formatCurrency(point.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="grid gap-4">
            <section className="rounded-[26px] bg-white/90 p-4 ring-1 ring-po-border/80">
              <h3 className="text-base font-extrabold text-po-text">Tuổi nợ</h3>
              <div className="mt-3 grid gap-2">
                <AgingRow label="0-7 ngày" bucket={summary?.aging0To7Days} />
                <AgingRow label="8-30 ngày" bucket={summary?.aging8To30Days} />
                <AgingRow label="31+ ngày" bucket={summary?.aging31PlusDays} />
              </div>
            </section>

            <PaymentHistory
              items={paymentHistoryItems}
              isLoading={paymentHistoryQuery.isLoading}
            />

            <BillingQueue
              unpaidItems={unpaidItems}
              refundItems={refundItems}
              isLoadingUnpaid={unpaidQuery.isLoading}
              isLoadingRefunds={refundsQuery.isLoading}
              onRefund={setRefundTarget}
            />
          </aside>
        </div>
      )}

      {refundTarget ? (
        <Modal title="Xác nhận hoàn tiền" onClose={() => setRefundTarget(null)}>
          <p className="text-sm text-po-text-muted">
            {refundTarget.invoiceCode} · {formatCurrency(refundTarget.paidAmount ?? refundTarget.finalAmount)}
          </p>
          <label className="mt-4 grid gap-1.5 text-sm font-semibold text-po-text">
            Ghi chú hoàn tiền
            <textarea
              rows={4}
              value={refundNote}
              onChange={(event) => setRefundNote(event.target.value)}
              className="resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            />
          </label>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setRefundTarget(null)} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">Hủy</button>
            <button
              onClick={() => refundMutation.mutate()}
              disabled={!refundNote.trim() || refundMutation.isPending}
              className="inline-flex h-10 items-center rounded-full bg-po-danger px-5 text-sm font-semibold text-white transition hover:bg-po-danger/90 disabled:opacity-60"
            >
              {refundMutation.isPending ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </Modal>
      ) : null}

      {qrRequest ? (
        <Modal title={qrStatusQuery.data?.status === "Paid" ? "Thanh toán thành công" : "QR thanh toán SePay"} onClose={() => setQrRequest(null)}>
          <div className="grid gap-4 text-center">
            {qrStatusQuery.data?.status === "Paid" ? (
              <div className="mx-auto grid size-24 place-items-center rounded-full bg-po-success-soft text-po-success ring-8 ring-po-success-soft/60">
                <CheckCircle2 className="size-14" />
              </div>
            ) : (
              <img src={qrRequest.qrCodeUrl} alt="SePay QR" className="mx-auto size-56 rounded-2xl border border-po-border object-contain p-3" />
            )}
            <div>
              <p className="text-sm font-bold text-po-text">{qrRequest.invoiceCode}</p>
              <p className="mt-2 rounded-2xl bg-po-primary-soft px-4 py-2 font-mono text-base font-extrabold text-po-primary">
                {qrRequest.paymentReference}
              </p>
              <p className="mt-1 text-xs text-po-text-muted">{qrRequest.bankCode} · {qrRequest.bankAccountNo}</p>
              <p className="mt-2 text-lg font-extrabold text-po-primary">{formatCurrency(qrRequest.finalAmount)}</p>
            </div>
            <SePayPaymentStatusPanel status={qrStatusQuery.data} isLoading={qrStatusQuery.isFetching} />
            {qrStatusQuery.data?.status === "Paid" ? (
              <button
                type="button"
                onClick={() => setQrRequest(null)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-po-success px-5 text-sm font-bold text-white transition hover:bg-po-success/90"
              >
                Hoàn tất
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmBillingAction}
        title={billingConfirmCopy(confirmTarget).title}
        description={billingConfirmCopy(confirmTarget).description}
        confirmLabel={billingConfirmCopy(confirmTarget).confirmLabel}
        variant={confirmTarget?.type === "cancel" || confirmTarget?.type === "remove-cart" ? "danger" : "warning"}
        isLoading={payMutation.isPending || sePayMutation.isPending || cancelMutation.isPending}
      />
    </div>
  )
}

function billingConfirmCopy(target: BillingConfirmTarget | null) {
  if (!target) {
    return {
      title: "",
      description: "",
      confirmLabel: "Xác nhận",
    }
  }

  switch (target.type) {
    case "pay":
      return {
        title: "Ghi nhận thanh toán",
        description: `Xác nhận hóa đơn ${target.invoice.invoiceCode} đã thanh toán bằng ${target.methodLabel} với số tiền ${formatCurrency(target.invoice.finalAmount)}?`,
        confirmLabel: "Ghi nhận thanh toán",
      }
    case "sepay":
      return {
        title: "Tạo yêu cầu SePay",
        description: `Tạo QR thanh toán cho hóa đơn ${target.invoice.invoiceCode} với số tiền ${formatCurrency(target.invoice.finalAmount)}?`,
        confirmLabel: "Tạo QR",
      }
    case "cancel":
      return {
        title: "Hủy hóa đơn",
        description: `Bạn có chắc muốn hủy hóa đơn ${target.invoice.invoiceCode}? Hành động này sẽ ảnh hưởng doanh thu và đối soát.`,
        confirmLabel: "Hủy hóa đơn",
      }
    case "remove-cart":
      return {
        title: "Xóa mặt hàng khỏi giỏ",
        description: `Xóa ${target.item.itemName} khỏi giỏ bán hàng tại quầy?`,
        confirmLabel: "Xóa khỏi giỏ",
      }
  }
}

function SePayPaymentStatusPanel({
  status,
  isLoading,
}: {
  status?: SePayPaymentStatusResponse
  isLoading: boolean
}) {
  const effectiveStatus = status?.status ?? "Pending"
  const tone = {
    Pending: "border-po-border bg-po-surface-muted text-po-text-muted",
    Paid: "border-po-success/30 bg-po-success-soft text-po-success",
    ReceivedUnmatched: "border-po-warning/30 bg-po-warning-soft text-po-warning",
    AmountMismatch: "border-po-danger/30 bg-po-danger-soft text-po-danger",
  }[effectiveStatus] ?? "border-po-border bg-po-surface-muted text-po-text-muted"

  const message = status?.message ?? "Đang chờ thanh toán..."
  const isPaid = effectiveStatus === "Paid"

  return (
    <div className={`rounded-2xl border px-4 py-3 text-left ${tone}`}>
      <div className="flex items-start gap-3">
        {isPaid ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        ) : null}
        <div className="min-w-0">
      <p className="text-sm font-extrabold">{isPaid ? "Thanh toán thành công." : message}</p>
      {status?.receivedAmount != null ? (
        <p className="mt-1 text-xs font-semibold">
          Đã nhận {formatCurrency(status.receivedAmount)} / cần thu {formatCurrency(status.finalAmount)}
        </p>
      ) : (
        <p className="mt-1 text-xs font-semibold">{isLoading ? "Đang kiểm tra giao dịch..." : "Tự động kiểm tra mỗi 2 giây."}</p>
      )}
        </div>
      </div>
    </div>
  )
}

function PaymentHistory({
  items,
  isLoading,
}: {
  items: SePayReconciliationItemResponse[]
  isLoading: boolean
}) {
  const paidItems = items
    .filter((item) => item.invoiceId)
    .slice(0, 8)

  return (
    <section className="rounded-[26px] bg-white/90 p-4 ring-1 ring-po-border/80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-po-text">Lịch sử thanh toán</h3>
          <p className="mt-1 text-xs text-po-text-muted">Giao dịch SePay đã khớp hóa đơn gần nhất.</p>
        </div>
        <StatusBadge variant="success" label={`${paidItems.length} giao dịch`} />
      </div>

      <div className="mt-3 grid gap-2">
        {isLoading ? (
          <div className="rounded-2xl bg-po-surface-muted py-8 text-center">
            <LoadingSpinner />
          </div>
        ) : paidItems.length === 0 ? (
          <EmptyState icon={CreditCard} title="Chưa có lịch sử" description="Thanh toán SePay đã khớp hóa đơn sẽ xuất hiện ở đây." className="py-8" />
        ) : (
          paidItems.map((item) => (
            <div key={item.paymentTransactionId} className="rounded-2xl bg-po-success-soft/45 p-3 ring-1 ring-po-success/15">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-po-text">{item.invoiceCode ?? item.referenceCode ?? "SePay"}</p>
                  <p className="mt-1 text-xs font-semibold text-po-text-muted">
                    {formatDate(item.transactionDate, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <CheckCircle2 className="size-5 shrink-0 text-po-success" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="truncate text-xs text-po-text-subtle">{item.referenceCode ?? item.providerTransactionId}</p>
                <p className="shrink-0 text-sm font-extrabold text-po-success">{formatCurrency(item.transferAmount)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function AppointmentStatusSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-bold text-po-text">
      Trạng thái
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-0 rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      >
        {appointmentStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function AppointmentSelect({
  value,
  appointments,
  isLoading,
  onChange,
}: {
  value: string
  appointments: AppointmentListItemResponse[]
  isLoading: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-bold text-po-text">
      Lịch hẹn cần thu
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading}
        className="h-10 min-w-0 rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
      >
        <option value="">
          {isLoading ? "Đang tải lịch hẹn..." : appointments.length === 0 ? "Không tìm thấy lịch phù hợp" : "Chọn lịch hẹn"}
        </option>
        {appointments.map((appointment) => (
          <option key={appointment.appointmentId} value={appointment.appointmentId}>
            {formatTime(appointment.startTime)} - Pet {formatShortId(appointment.petId)} - {appointmentTypeLabel(appointment.appointmentType)} - {appointmentStatusLabel(appointment.status)}
          </option>
        ))}
      </select>
      <span className="flex items-center gap-1 text-[11px] font-medium text-po-text-subtle">
        <CalendarCheck className="size-3" />
        Chọn đúng lịch để lấy dịch vụ và toa thuốc vào hóa đơn.
      </span>
    </label>
  )
}

function InvoiceCard({
  invoice,
  onPayCash,
  onPayBank,
  onSePay,
  onCancel,
  busy,
}: {
  invoice: InvoiceResponse
  onPayCash: () => void
  onPayBank: () => void
  onSePay: () => void
  onCancel: () => void
  busy: boolean
}) {
  const isPaid = invoice.status.toLowerCase() === "paid"
  const isCancelled = invoice.status.toLowerCase() === "cancelled"

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-po-text">{invoice.invoiceCode}</p>
            <StatusBadge variant={isPaid ? "success" : isCancelled ? "danger" : "warning"} label={invoiceStatusLabel(invoice.status)} />
          </div>
          <p className="mt-1 text-xs text-po-text-muted">{invoice.items.length} dòng · tạo ngày {formatDate(invoice.createdAt)}</p>
          <p className="mt-1 text-xs text-po-text-subtle">
            Nguồn: {invoiceSourceLabel(invoice.invoiceSource)}
            {invoice.appointmentId ? ` · Lịch ${formatShortId(invoice.appointmentId)}` : ""}
            {invoice.orderId ? ` · Đơn hàng ${formatShortId(invoice.orderId)}` : ""}
          </p>
        </div>
        <p className="text-xl font-extrabold text-po-primary">{formatCurrency(invoice.finalAmount)}</p>
      </div>
      <div className="grid gap-2">
        {invoice.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 rounded-2xl bg-po-surface-muted px-4 py-3 text-sm">
            <span className="font-semibold text-po-text">{item.description}</span>
            <span className="shrink-0 text-po-text-muted">{item.quantity} x {formatCurrency(item.unitPrice)}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy || isPaid || isCancelled} onClick={onPayCash} className="inline-flex h-9 items-center rounded-full bg-po-success-soft px-4 text-xs font-semibold text-po-success transition hover:bg-po-success hover:text-white disabled:opacity-60">Tiền mặt</button>
        <button disabled={busy || isPaid || isCancelled} onClick={onPayBank} className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:bg-po-primary hover:text-white disabled:opacity-60">Chuyển khoản</button>
        <button disabled={busy || isPaid || isCancelled} onClick={onSePay} className="inline-flex h-9 items-center rounded-full bg-po-accent-soft px-4 text-xs font-semibold text-po-accent transition hover:bg-po-accent hover:text-white disabled:opacity-60">Tạo QR</button>
        <button disabled={busy || isPaid || isCancelled} onClick={onCancel} className="inline-flex h-9 items-center rounded-full bg-po-danger-soft px-4 text-xs font-semibold text-po-danger transition hover:bg-po-danger hover:text-white disabled:opacity-60">Hủy</button>
      </div>
    </div>
  )
}

function WorkspaceButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-bold transition ${
        active
          ? "bg-po-primary text-white shadow-sm shadow-orange-200"
          : "text-po-text-muted hover:bg-white hover:text-po-text"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

function BillingQueue({
  unpaidItems,
  refundItems,
  isLoadingUnpaid,
  isLoadingRefunds,
  onRefund,
}: {
  unpaidItems: InvoiceAgingItemResponse[]
  refundItems: PendingManualRefundItemResponse[]
  isLoadingUnpaid: boolean
  isLoadingRefunds: boolean
  onRefund: (item: PendingManualRefundItemResponse) => void
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
      <div className="border-b border-po-border/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-po-text">Hàng đợi thu ngân</h3>
            <p className="mt-1 text-xs text-po-text-muted">Các việc cần xử lý trong ca trực.</p>
          </div>
          <StatusBadge variant="warning" label={`${unpaidItems.length + refundItems.length} việc`} />
        </div>
      </div>

      <div className="grid content-start gap-4 p-4">
        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-po-text-subtle">
              Chưa thanh toán
            </p>
            <span className="rounded-full bg-po-warning-soft px-2.5 py-1 text-xs font-bold text-po-warning">
              {unpaidItems.length}
            </span>
          </div>
          {isLoadingUnpaid ? (
            <div className="rounded-2xl bg-po-surface-muted py-8 text-center">
              <LoadingSpinner />
            </div>
          ) : unpaidItems.length === 0 ? (
            <EmptyState icon={ReceiptText} title="Không có công nợ" description="Các hóa đơn trong hàng đợi đã được xử lý." className="py-8" />
          ) : (
            <div className="grid gap-3">
              {unpaidItems.map((item) => (
                <div key={item.invoiceId} className="rounded-2xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-po-text">{item.invoiceCode}</p>
                      <p className="mt-1 text-xs font-medium text-po-text-muted">
                        {invoiceSourceLabel(item.invoiceSource)}
                        {item.appointmentId ? ` · lịch ${formatShortId(item.appointmentId)}` : ""}
                        {item.orderId ? ` · đơn ${formatShortId(item.orderId)}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold text-po-primary">{formatCurrency(item.finalAmount)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="text-po-text-subtle">{formatDate(item.createdAt)}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-po-warning ring-1 ring-po-border/70">
                      {item.pendingDays} ngày
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-po-text-subtle">
              Hoàn tiền thủ công
            </p>
            <span className="rounded-full bg-po-danger-soft px-2.5 py-1 text-xs font-bold text-po-danger">
              {refundItems.length}
            </span>
          </div>
          {isLoadingRefunds ? (
            <div className="rounded-2xl bg-po-surface-muted py-8 text-center">
              <LoadingSpinner />
            </div>
          ) : refundItems.length === 0 ? (
            <EmptyState icon={RotateCcw} title="Không có yêu cầu" description="Chưa có hóa đơn hủy cần hoàn tiền thủ công." className="py-8" />
          ) : (
            <div className="grid gap-3">
              {refundItems.map((item) => (
                <div key={item.invoiceId} className="rounded-2xl bg-po-danger-soft/40 p-4 ring-1 ring-po-danger/15">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-po-text">{item.invoiceCode}</p>
                      <p className="mt-1 text-xs font-medium text-po-text-muted">
                        {item.cancellationReason || "Đang chờ xác nhận hoàn tiền"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold text-po-danger">
                      {formatCurrency(item.paidAmount ?? item.finalAmount)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-po-text-subtle">{item.pendingDays} ngày chờ</span>
                    <button
                      type="button"
                      onClick={() => onRefund(item)}
                      className="inline-flex h-9 items-center rounded-full bg-white px-4 text-xs font-bold text-po-danger ring-1 ring-po-danger/20 transition hover:bg-po-danger hover:text-white"
                    >
                      Xác nhận
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  compact,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone: "success" | "warning" | "danger" | "info"
  compact?: boolean
}) {
  const toneClass = {
    success: "bg-po-success-soft text-po-success",
    warning: "bg-po-warning-soft text-po-warning",
    danger: "bg-po-danger-soft text-po-danger",
    info: "bg-po-primary-soft text-po-primary",
  }[tone]

  return (
    <div className={`grid min-h-[92px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[22px] border border-po-border bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}>
      <div className={`${compact ? "size-9" : "size-10"} inline-flex items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-po-text-muted">{label}</p>
        <p className={`mt-1 font-extrabold leading-none text-po-text ${compact ? "text-lg" : "text-xl"}`}>{value}</p>
        {hint ? <p className="mt-1.5 text-xs font-semibold text-po-text-subtle">{hint}</p> : null}
      </div>
    </div>
  )
}

function AgingRow({
  label,
  bucket,
}: {
  label: string
  bucket?: { count: number; amount: number }
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-2.5">
      <div>
        <p className="text-xs font-bold text-po-text">{label}</p>
        <p className="text-xs text-po-text-muted">{bucket?.count ?? 0} hóa đơn</p>
      </div>
      <p className="text-sm font-extrabold text-po-text">{formatCurrency(bucket?.amount)}</p>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  compact,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  compact?: boolean
}) {
  return (
    <label className={`grid min-w-0 gap-1.5 text-xs font-bold text-po-text ${compact ? "w-full sm:w-32" : ""}`}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-0 rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
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
