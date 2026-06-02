import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Banknote, CreditCard, PackageSearch, Plus, QrCode, ReceiptText, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { formatCurrency, formatDate, formatShortId } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import {
  autoComposeInvoiceApi,
  cancelInvoiceApi,
  confirmManualRefundApi,
  createOrderApi,
  getBillingRevenueTrendApi,
  getBillingSummaryApi,
  getInvoiceByAppointmentApi,
  getPendingManualRefundsApi,
  getUnpaidAgingApi,
  payInvoiceApi,
  requestSePayPaymentApi,
} from "@/services/clinic-billing.service"
import { getInventoryApi } from "@/services/clinic.service"
import type { InvoiceResponse, PendingManualRefundItemResponse, SePayPaymentRequestResponse } from "@/types"

const today = new Date().toISOString().slice(0, 10)
const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

type RetailCartItem = {
  inventoryItemId: string
  itemName: string
  quantity: number
  unitPrice: number
  availableQuantity: number
}

export default function ClinicBillingPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [fromDate, setFromDate] = useState(sevenDaysAgo)
  const [toDate, setToDate] = useState(today)
  const [appointmentInput, setAppointmentInput] = useState("")
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

  const inventoryQuery = useQuery({
    queryKey: ["clinic", clinicId, "inventory"],
    queryFn: () => getInventoryApi(clinicId),
    enabled: Boolean(clinicId),
  })

  const invoiceQuery = useQuery({
    queryKey: ["clinic", clinicId, "invoice-by-appointment", selectedAppointmentId],
    queryFn: () => getInvoiceByAppointmentApi(clinicId, selectedAppointmentId),
    enabled: Boolean(clinicId && selectedAppointmentId),
  })

  const invalidateBilling = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "dashboard-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "unpaid-aging"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "manual-refunds"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "revenue-trend"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "invoice-by-appointment"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "inventory"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "reconciliation"] }),
    ])
  }

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
      setRetailInvoice(null)
      await invalidateBilling()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể ghi nhận thanh toán.")),
  })

  const sePayMutation = useMutation({
    mutationFn: (invoice: InvoiceResponse) =>
      requestSePayPaymentApi(clinicId, invoice.id, { paymentReference: invoice.paymentReference }),
    onSuccess: async (data) => {
      setQrRequest(data)
      toast.success("Đã tạo yêu cầu thanh toán SePay.")
      await invalidateBilling()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo QR SePay.")),
  })

  const cancelMutation = useMutation({
    mutationFn: (invoice: InvoiceResponse) =>
      cancelInvoiceApi(clinicId, invoice.id, { cancelReason: "Hủy từ quầy thu ngân clinic" }),
    onSuccess: async () => {
      toast.success("Đã hủy hóa đơn.")
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

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={ReceiptText} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi mở quầy thu ngân." />
  }

  const summary = summaryQuery.data
  const invoice = invoiceQuery.data
  const points = trendQuery.data?.points ?? []

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Thu ngân và công nợ</h2>
          <p className="mt-1 text-sm text-po-text-muted">Theo dõi doanh thu, hóa đơn chưa thu và thao tác thanh toán tại quầy.</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
          <Input label="Từ ngày" type="date" value={fromDate} onChange={setFromDate} compact />
          <Input label="Đến ngày" type="date" value={toDate} onChange={setToDate} compact />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Doanh thu hôm nay" value={formatCurrency(summary?.todayPaidRevenue)} icon={Banknote} tone="success" />
        <MetricCard label="Hóa đơn chưa thu" value={String(summary?.unpaidInvoiceCount ?? 0)} hint={formatCurrency(summary?.totalUnpaidAmount)} icon={ReceiptText} tone="warning" />
        <MetricCard label="Cần đối soát" value={String(summary?.pendingReconciliationCount ?? 0)} icon={QrCode} tone="info" />
        <MetricCard label="Chờ hoàn tiền" value={String(summary?.pendingManualRefundCount ?? 0)} icon={RotateCcw} tone="danger" />
      </div>

      <DashboardSection title="Mở hóa đơn theo lịch hẹn" subtitle="MVP hiện tại bắt buộc hóa đơn gắn với appointment. Với đơn bán lẻ (hạt, phụ kiện), hãy tạo walk-in trước rồi thu ngân trên appointment đó.">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <Input label="AppointmentId" value={appointmentInput} onChange={setAppointmentInput} />
          <Input label="Giảm giá" value={discountAmount} onChange={setDiscountAmount} />
          <button
            onClick={() => setSelectedAppointmentId(appointmentInput.trim())}
            disabled={!appointmentInput.trim()}
            className="self-end inline-flex h-11 items-center justify-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            Tìm hóa đơn
          </button>
        </div>
        <p className="mt-3 text-xs text-po-text-subtle">
          Luồng thanh toán: tạo hoặc tìm hóa đơn theo appointment, chọn Tiền mặt/Chuyển khoản hoặc tạo QR SePay, rồi bấm ghi nhận khi đã nhận tiền.
        </p>

        {selectedAppointmentId ? (
          <div className="mt-5 rounded-2xl border border-po-border bg-white p-4">
            {invoiceQuery.isLoading ? (
              <div className="py-8 text-center"><LoadingSpinner /></div>
            ) : invoice ? (
              <InvoiceCard
                invoice={invoice}
                onPayCash={() => payMutation.mutate({ invoice, method: "Cash" })}
                onPayBank={() => payMutation.mutate({ invoice, method: "BankTransfer" })}
                onSePay={() => sePayMutation.mutate(invoice)}
                onCancel={() => cancelMutation.mutate(invoice)}
                busy={payMutation.isPending || sePayMutation.isPending || cancelMutation.isPending}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-po-text">Chưa có hóa đơn</p>
                  <p className="mt-1 text-xs text-po-text-muted">Auto-compose sẽ lấy dịch vụ và toa thuốc đã ghi trong buổi khám.</p>
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
      </DashboardSection>

      <DashboardSection
        title="Bán hàng tại quầy"
        subtitle="Dành cho khách mua thuốc, thức ăn hoặc phụ kiện không cần khám. Tạo order trước, sau đó hệ thống sinh invoice từ order."
      >
        <div className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
            <label className="grid gap-1.5 text-sm font-semibold text-po-text">
              Mặt hàng trong kho
              <select
                value={selectedInventoryId}
                onChange={(event) => setSelectedInventoryId(event.target.value)}
                className="h-11 min-w-0 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
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
              className="self-end inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              <Plus className="size-4" />
              Thêm
            </button>
          </div>

          <div className="grid gap-3 rounded-2xl border border-po-border bg-white p-4">
            {retailCart.length === 0 ? (
              <EmptyState icon={PackageSearch} title="Chưa có mặt hàng" description="Chọn mặt hàng trong kho để tạo đơn bán hàng tại quầy." />
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
                      onClick={() => setRetailCart((current) => current.filter((cartItem) => cartItem.inventoryItemId !== item.inventoryItemId))}
                      className="rounded-full p-2 text-po-danger transition hover:bg-po-danger-soft"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
            <Input label="Giảm giá" value={retailDiscountAmount} onChange={setRetailDiscountAmount} />
            <div className="rounded-2xl bg-po-surface-muted px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-po-text-subtle">Tạm tính</p>
              <p className="mt-1 text-xl font-extrabold text-po-text">
                {formatCurrency(Math.max(0, retailCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - (Number(retailDiscountAmount) || 0)))}
              </p>
            </div>
            <button
              onClick={() => createRetailInvoiceMutation.mutate()}
              disabled={retailCart.length === 0 || createRetailInvoiceMutation.isPending}
              className="inline-flex h-11 items-center justify-center rounded-full bg-po-success px-5 text-sm font-semibold text-white transition hover:bg-po-success/90 disabled:opacity-60"
            >
              {createRetailInvoiceMutation.isPending ? "Đang tạo..." : "Tạo hóa đơn bán hàng"}
            </button>
          </div>

          {retailInvoice ? (
            <div className="rounded-2xl border border-po-border bg-white p-4">
              <InvoiceCard
                invoice={retailInvoice}
                onPayCash={() => payMutation.mutate({ invoice: retailInvoice, method: "Cash" })}
                onPayBank={() => payMutation.mutate({ invoice: retailInvoice, method: "BankTransfer" })}
                onSePay={() => sePayMutation.mutate(retailInvoice)}
                onCancel={() => cancelMutation.mutate(retailInvoice)}
                busy={payMutation.isPending || sePayMutation.isPending || cancelMutation.isPending}
              />
            </div>
          ) : null}
        </div>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <DashboardSection title="Doanh thu theo ngày" subtitle={`${formatDate(trendQuery.data?.fromDate)} - ${formatDate(trendQuery.data?.toDate)}`}>
          {trendQuery.isLoading ? (
            <div className="py-12 text-center"><LoadingSpinner /></div>
          ) : points.length === 0 ? (
            <EmptyState icon={CreditCard} title="Chưa có doanh thu" description="Khoảng ngày này chưa ghi nhận hóa đơn đã thanh toán." />
          ) : (
            <div className="grid gap-2">
              {points.map((point) => (
                <div key={point.date} className="grid gap-3 rounded-2xl border border-po-border bg-white p-4 sm:grid-cols-[150px_1fr_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-bold text-po-text">{formatDate(point.date)}</p>
                    <p className="text-xs text-po-text-muted">{point.paidInvoiceCount} hóa đơn</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-po-surface-muted">
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
        </DashboardSection>

        <DashboardSection title="Tuổi nợ" subtitle="Ưu tiên xử lý hóa đơn càng lâu ngày càng trước.">
          <div className="grid gap-3">
            <AgingRow label="0-7 ngày" bucket={summary?.aging0To7Days} />
            <AgingRow label="8-30 ngày" bucket={summary?.aging8To30Days} />
            <AgingRow label="31+ ngày" bucket={summary?.aging31PlusDays} />
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection title="Hóa đơn chưa thu" subtitle="Danh sách rút gọn để nhân viên gọi nhắc hoặc thu tại quầy.">
          {unpaidQuery.isLoading ? (
            <div className="py-12 text-center"><LoadingSpinner /></div>
          ) : (unpaidQuery.data ?? []).length === 0 ? (
            <EmptyState icon={ReceiptText} title="Không còn nợ" description="Tất cả hóa đơn đã được xử lý." />
          ) : (
            <div className="grid gap-2">
              {(unpaidQuery.data ?? []).map((item) => (
                <div key={item.invoiceId} className="rounded-2xl border border-po-border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-po-text">{item.invoiceCode}</p>
                      <p className="mt-1 text-xs text-po-text-muted">
                        {item.appointmentId ? formatShortId(item.appointmentId) : item.orderId ? `Order ${formatShortId(item.orderId)}` : item.invoiceSource} · {item.pendingDays} ngày
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-po-warning">{formatCurrency(item.finalAmount)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge variant="warning" label={item.paymentProvider} />
                    {item.paymentReference ? <StatusBadge variant="info" label={item.paymentReference} /> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Hoàn tiền thủ công" subtitle="Hóa đơn bị hủy sau khi đã thanh toán cần xác nhận hoàn tiền ngoài hệ thống.">
          {refundsQuery.isLoading ? (
            <div className="py-12 text-center"><LoadingSpinner /></div>
          ) : (refundsQuery.data ?? []).length === 0 ? (
            <EmptyState icon={RotateCcw} title="Không có hoàn tiền chờ xử lý" description="Các hóa đơn cần hoàn tiền sẽ xuất hiện tại đây." />
          ) : (
            <div className="grid gap-2">
              {(refundsQuery.data ?? []).map((item) => (
                <div key={item.invoiceId} className="rounded-2xl border border-po-border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-po-text">{item.invoiceCode}</p>
                      <p className="mt-1 text-xs text-po-text-muted">{item.cancellationReason ?? "Chưa có lý do hủy"}</p>
                    </div>
                    <p className="text-sm font-extrabold text-po-danger">{formatCurrency(item.paidAmount ?? item.finalAmount)}</p>
                  </div>
                  <button
                    onClick={() => setRefundTarget(item)}
                    className="mt-3 inline-flex h-9 items-center rounded-full bg-po-danger-soft px-4 text-xs font-semibold text-po-danger transition hover:bg-po-danger hover:text-white"
                  >
                    Xác nhận hoàn tiền
                  </button>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

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
        <Modal title="QR thanh toán SePay" onClose={() => setQrRequest(null)}>
          <div className="grid gap-4 text-center">
            <img src={qrRequest.qrCodeUrl} alt="SePay QR" className="mx-auto size-56 rounded-2xl border border-po-border object-contain p-3" />
            <div>
              <p className="text-sm font-bold text-po-text">{qrRequest.invoiceCode}</p>
              <p className="mt-1 text-xs text-po-text-muted">{qrRequest.bankCode} · {qrRequest.bankAccountNo}</p>
              <p className="mt-2 text-lg font-extrabold text-po-primary">{formatCurrency(qrRequest.finalAmount)}</p>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
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
            <StatusBadge variant={isPaid ? "success" : isCancelled ? "danger" : "warning"} label={invoice.status} />
          </div>
          <p className="mt-1 text-xs text-po-text-muted">{invoice.items.length} dòng · tạo ngày {formatDate(invoice.createdAt)}</p>
          <p className="mt-1 text-xs text-po-text-subtle">
            Nguồn: {invoice.invoiceSource}
            {invoice.appointmentId ? ` · Appointment ${formatShortId(invoice.appointmentId)}` : ""}
            {invoice.orderId ? ` · Order ${formatShortId(invoice.orderId)}` : ""}
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

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Banknote
  tone: "success" | "warning" | "danger" | "info"
}) {
  const toneClass = {
    success: "bg-po-success-soft text-po-success",
    warning: "bg-po-warning-soft text-po-warning",
    danger: "bg-po-danger-soft text-po-danger",
    info: "bg-po-primary-soft text-po-primary",
  }[tone]

  return (
    <div className="rounded-[24px] border border-po-border bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex size-10 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-semibold text-po-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-po-text">{value}</p>
      {hint ? <p className="mt-1 text-xs font-semibold text-po-text-subtle">{hint}</p> : null}
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
    <div className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3">
      <div>
        <p className="text-sm font-bold text-po-text">{label}</p>
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
    <label className={`grid min-w-0 gap-1.5 text-sm font-semibold text-po-text ${compact ? "w-full sm:w-40" : ""}`}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
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
