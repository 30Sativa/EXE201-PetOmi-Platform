import {
  ArrowUpDown,
  CircleCheckBig,
  Clock3,
  Crown,
  Download,
  Eye,
  Layers3,
  Loader2,
  ReceiptText,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import StatusBadge from "@/components/ui/StatusBadge"
import SelectMenu from "@/components/ui/SelectMenu"
import { maskEmail } from "@/lib/format"
import {
  exportAdminPremiumPaymentsApi,
  getAdminChatSubscriptionsApi,
} from "@/services/chat-subscription.service"
import type {
  AdminChatSubscriptionItemResponse,
  AdminChatSubscriptionPaymentItemResponse,
  ChatSubscriptionPlanResponse,
} from "@/types"

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0)

const formatDate = (value?: string | null) => {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
    case "paid":
      return "success" as const
    case "pending":
      return "warning" as const
    case "expired":
    case "cancelled":
      return "danger" as const
    default:
      return "default" as const
  }
}

const STATUS_LABELS: Record<string, string> = {
  active: "Đang hoạt động",
  paid: "Đã thanh toán",
  pending: "Chờ xử lý",
  expired: "Hết hạn",
  cancelled: "Đã hủy",
}

const statusLabel = (status: string) =>
  STATUS_LABELS[status.toLowerCase()] ?? status

const ownerName = (name?: string | null, email?: string | null, fallback?: string | null) =>
  name?.trim() || email?.split("@")[0] || (fallback ? `KH-${fallback.slice(0, 6).toUpperCase()}` : "Khách hàng")

type PaymentSort = "newest" | "oldest" | "amount-desc" | "amount-asc"

const paymentSortOptions: Array<{ value: PaymentSort; label: string }> = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "amount-desc", label: "Số tiền cao nhất" },
  { value: "amount-asc", label: "Số tiền thấp nhất" },
]

const subscriptionPageSize = 6
const paymentPageSize = 8

export default function AdminChatSubscriptionsPage() {
  const [subscriptionPage, setSubscriptionPage] = useState(1)
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentSort, setPaymentSort] = useState<PaymentSort>("newest")
  const [exportFromDate, setExportFromDate] = useState("")
  const [exportToDate, setExportToDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<AdminChatSubscriptionPaymentItemResponse | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "chat-subscriptions"],
    queryFn: () => getAdminChatSubscriptionsApi(80),
    refetchOnMount: "always",
  })

  const plans = data?.plans ?? []
  const premiumPlan = plans.find((plan) => plan.code.toLowerCase() === "premium")
  const subscriptions = data?.subscriptions ?? []
  const payments = data?.payments ?? []
  const activeSubscriptions = subscriptions.filter((item) => item.isActive)
  const pendingPayments = payments.filter((item) => item.status.toLowerCase() === "pending")
  const paidPayments = payments.filter((item) => item.status.toLowerCase() === "paid")
  const paidRevenue = paidPayments.reduce((total, item) => total + item.amount, 0)
  const paymentSuccessRate = payments.length ? (paidPayments.length / payments.length) * 100 : 0

  const subscriptionPageCount = Math.max(1, Math.ceil(subscriptions.length / subscriptionPageSize))
  const currentSubscriptionPage = Math.min(subscriptionPage, subscriptionPageCount)
  const visibleSubscriptions = subscriptions.slice(
    (currentSubscriptionPage - 1) * subscriptionPageSize,
    currentSubscriptionPage * subscriptionPageSize,
  )

  const sortedPayments = [...payments].sort((left, right) => {
    if (paymentSort === "amount-desc") return right.amount - left.amount
    if (paymentSort === "amount-asc") return left.amount - right.amount
    const leftTime = new Date(left.createdAt).getTime()
    const rightTime = new Date(right.createdAt).getTime()
    return paymentSort === "oldest" ? leftTime - rightTime : rightTime - leftTime
  })
  const paymentPageCount = Math.max(1, Math.ceil(sortedPayments.length / paymentPageSize))
  const currentPaymentPage = Math.min(paymentPage, paymentPageCount)
  const visiblePayments = sortedPayments.slice(
    (currentPaymentPage - 1) * paymentPageSize,
    currentPaymentPage * paymentPageSize,
  )

  const handleExportPremiumPayments = async () => {
    if (exportFromDate && exportToDate && exportFromDate > exportToDate) {
      toast.error("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.")
      return
    }

    setIsExporting(true)

    try {
      const file = await exportAdminPremiumPaymentsApi({
        fromDate: exportFromDate || undefined,
        toDate: exportToDate || undefined,
      })
      const downloadUrl = URL.createObjectURL(file)
      const link = document.createElement("a")
      const rangeLabel =
        exportFromDate || exportToDate
          ? `${exportFromDate || "tu-dau"}-${exportToDate || "den-nay"}`
          : "toan-bo"

      link.href = downloadUrl
      link.download = `PetOmi_AI_Premium_${rangeLabel}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      toast.success("Đã xuất danh sách giao dịch AI Premium.")
    } catch (error) {
      console.error("Export AI Premium payments failed", error)
      toast.error("Không thể xuất file Excel. Vui lòng thử lại.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="grid gap-5 md:gap-6">
      <section className="rounded-[28px] bg-[#14372f] p-5 text-white shadow-lg shadow-emerald-950/10 ring-1 ring-[#14372f]/90 md:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-50 ring-1 ring-white/15">
              <Crown className="size-3.5 text-[#ffad78]" />
              AI Premium
            </div>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight md:text-3xl">
              Quản lý gói chat AI và doanh thu Premium
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-emerald-50/70">
              Theo dõi gói dịch vụ, thanh toán và trạng thái đăng ký theo tài khoản chủ nuôi.
            </p>
          </div>

          {premiumPlan ? (
            <div className="rounded-[22px] bg-white/10 p-4 ring-1 ring-white/12">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-50/65">Giá Premium</p>
              <p className="mt-2 text-3xl font-extrabold text-[#ffad78]">{formatCurrency(premiumPlan.priceMonthly)}</p>
              <p className="mt-1 text-xs font-bold text-emerald-50/70">
                Mức sử dụng mở rộng · chu kỳ {premiumPlan.billingCycleDays} ngày
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <div className="grid place-items-center rounded-[28px] bg-white py-16 ring-1 ring-po-border">
          <Loader2 className="size-8 animate-spin text-po-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Layers3} label="Gói đang hoạt động" value={activeSubscriptions.length} detail={`${subscriptions.length} đăng ký trong dữ liệu`} />
            <MetricCard icon={Clock3} label="Chờ thanh toán" value={pendingPayments.length} detail="Phiên thanh toán còn mở" />
            <MetricCard icon={WalletCards} label="Doanh thu đã thu" value={formatCurrency(paidRevenue)} detail={`${paidPayments.length} giao dịch thành công`} />
            <MetricCard icon={CircleCheckBig} label="Tỷ lệ thành công" value={`${paymentSuccessRate.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`} detail={`${paidPayments.length}/${payments.length} giao dịch đã thanh toán`} />
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary ring-1 ring-orange-100">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-po-text">Các gói dịch vụ</h3>
                  <p className="mt-1 text-sm font-medium text-po-text-muted">Hai mức sử dụng Free/Premium theo tài khoản.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.planId} plan={plan} />
                ))}
                {!plans.length ? (
                  <EmptyState icon={Sparkles} title="Chưa có gói" detail="Chưa có gói chat AI nào đang bật." />
                ) : null}
              </div>
            </section>

            <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
              <SectionHeader
                icon={UserRound}
                title="Gói đăng ký gần đây"
                detail={`${subscriptions.length} đăng ký mới nhất theo tài khoản chủ nuôi.`}
              />
              <div className="mt-5 grid gap-3">
                {visibleSubscriptions.map((item) => (
                  <SubscriptionRow key={item.subscriptionId} subscription={item} />
                ))}
                {!visibleSubscriptions.length ? (
                  <EmptyState icon={UserRound} title="Chưa có đăng ký" detail="Chưa có đăng ký Premium trong dữ liệu." />
                ) : null}
              </div>
              <Pagination
                page={currentSubscriptionPage}
                pageCount={subscriptionPageCount}
                onPrev={() => setSubscriptionPage((value) => Math.max(1, value - 1))}
                onNext={() => setSubscriptionPage((value) => Math.min(subscriptionPageCount, value + 1))}
              />
            </section>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <SectionHeader
                icon={ReceiptText}
                title="Giao dịch gần đây"
                detail={`${payments.length} giao dịch theo số tiền, voucher và chủ tài khoản.`}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SelectMenu
                  ariaLabel="Sắp xếp giao dịch"
                  value={paymentSort}
                  options={paymentSortOptions}
                  leadingIcon={ArrowUpDown}
                  onChange={(nextSort) => {
                    setPaymentSort(nextSort)
                    setPaymentPage(1)
                  }}
                  className="sm:w-52"
                  triggerClassName="rounded-2xl font-bold"
                />
                <div className="rounded-2xl bg-po-primary-soft px-4 py-3 text-sm font-extrabold text-po-primary ring-1 ring-orange-100">
                  {formatCurrency(paidRevenue)}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-[20px] border border-po-border bg-po-surface-muted/30 p-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-extrabold text-po-text-muted">
                  Từ ngày
                  <input
                    type="date"
                    value={exportFromDate}
                    max={exportToDate || undefined}
                    onChange={(event) => setExportFromDate(event.target.value)}
                    className="h-11 rounded-2xl border border-po-border bg-white px-3 text-sm font-semibold text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/15"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-extrabold text-po-text-muted">
                  Đến ngày
                  <input
                    type="date"
                    value={exportToDate}
                    min={exportFromDate || undefined}
                    onChange={(event) => setExportToDate(event.target.value)}
                    className="h-11 rounded-2xl border border-po-border bg-white px-3 text-sm font-semibold text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/15"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="text-xs font-semibold leading-5 text-po-text-muted">
                  Để trống để xuất toàn bộ giao dịch Premium đã thanh toán, gồm cả voucher 0đ.
                </p>
                <button
                  type="button"
                  onClick={handleExportPremiumPayments}
                  disabled={isExporting}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#14372f] px-4 text-sm font-extrabold text-white transition hover:bg-[#1c4a40] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExporting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {isExporting ? "Đang xuất..." : "Xuất Excel"}
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {visiblePayments.map((item) => (
                <PaymentRow key={item.paymentId} payment={item} onView={() => setSelectedPayment(item)} />
              ))}
              {!visiblePayments.length ? (
                <EmptyState icon={ReceiptText} title="Chưa có giao dịch" detail="Chưa có giao dịch thanh toán Premium." />
              ) : null}
            </div>
            <Pagination
              page={currentPaymentPage}
              pageCount={paymentPageCount}
              onPrev={() => setPaymentPage((value) => Math.max(1, value - 1))}
              onNext={() => setPaymentPage((value) => Math.min(paymentPageCount, value + 1))}
            />
          </section>
        </>
      )}

      {selectedPayment ? (
        <PaymentDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      ) : null}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  detail: string
}) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <Icon className="size-5" />
        </span>
        <span className="text-right text-2xl font-extrabold text-po-text">{value}</span>
      </div>
      <p className="mt-3 text-sm font-extrabold text-po-text">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-po-text-muted">{detail}</p>
    </article>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon
  title: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary ring-1 ring-orange-100">
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="text-lg font-extrabold text-po-text">{title}</h3>
        <p className="mt-1 text-sm font-medium text-po-text-muted">{detail}</p>
      </div>
    </div>
  )
}

function PlanCard({ plan }: { plan: ChatSubscriptionPlanResponse }) {
  const isPremium = plan.code.toLowerCase() === "premium"

  return (
    <article className="rounded-[22px] border border-po-border bg-po-surface-muted/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-extrabold text-po-text">{plan.name}</h4>
          <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-po-text-subtle">{plan.code}</p>
        </div>
        <StatusBadge label={plan.isActive ? "Đang bật" : "Đã tắt"} variant={plan.isActive ? "success" : "default"} />
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <p className="text-2xl font-extrabold text-po-primary">{formatCurrency(plan.priceMonthly)}</p>
        <p className="text-xs font-bold text-po-text-muted">{plan.billingCycleDays} ngày</p>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-semibold text-po-text-muted">
        <FeatureLine label="Mức sử dụng" value={isPremium ? "Mở rộng" : "Cơ bản"} />
        <FeatureLine label="Tư vấn chuyên sâu" value={plan.deepRagEnabled ? "Có" : "Không"} />
        <FeatureLine label="Gửi ảnh" value={plan.imageUploadEnabled ? "Có" : "Không"} />
        <FeatureLine label="Tốc độ phản hồi" value={plan.priorityLevel > 0 ? "Ưu tiên" : "Tiêu chuẩn"} />
      </div>
    </article>
  )
}

function SubscriptionRow({ subscription }: { subscription: AdminChatSubscriptionItemResponse }) {
  return (
    <article className="rounded-[20px] border border-po-border bg-po-surface-muted/30 p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_150px] md:items-center">
        <PersonBlock name={subscription.ownerName} email={subscription.ownerEmail} fallback={subscription.ownerUserId} />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-po-text-subtle">Gói</p>
          <p className="mt-1 text-sm font-extrabold text-po-text">{subscription.planName}</p>
        </div>
        <div className="md:text-right">
          <StatusBadge label={statusLabel(subscription.status)} variant={statusVariant(subscription.status)} />
          <p className="mt-2 text-xs font-semibold text-po-text-muted">{formatDate(subscription.expiresAt)}</p>
        </div>
      </div>
    </article>
  )
}

function PaymentRow({
  payment,
  onView,
}: {
  payment: AdminChatSubscriptionPaymentItemResponse
  onView: () => void
}) {
  return (
    <article className="rounded-[20px] border border-po-border bg-po-surface-muted/30 p-4">
      <div className="grid gap-3 lg:grid-cols-[150px_minmax(0,1fr)_150px_130px_120px_40px] lg:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-po-text-subtle">Mã GD</p>
          <p className="mt-1 truncate text-sm font-extrabold text-po-primary">{payment.paymentReference}</p>
        </div>
        <PersonBlock name={payment.ownerName} email={payment.ownerEmail} fallback={payment.ownerUserId} />
        <div>
          <p className="font-extrabold text-po-text">{formatCurrency(payment.amount)}</p>
          {(payment.discountAmount ?? 0) > 0 ? (
            <p className="text-xs font-bold text-po-success">Giảm {formatCurrency(payment.discountAmount)}</p>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-po-text-subtle">Voucher</p>
          <p className="mt-1 text-sm font-semibold text-po-text-muted">{payment.voucherCode ?? "--"}</p>
        </div>
        <div>
          <StatusBadge label={statusLabel(payment.status)} variant={statusVariant(payment.status)} />
          <p className="mt-2 text-xs font-semibold text-po-text-muted">{formatDate(payment.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={onView}
          className="inline-flex size-10 items-center justify-center rounded-full border border-po-border bg-white text-po-text-muted transition hover:text-po-primary"
          title="Xem chi tiết giao dịch"
        >
          <Eye className="size-4" />
        </button>
      </div>
    </article>
  )
}

function PersonBlock({
  name,
  email,
  fallback,
}: {
  name?: string | null
  email?: string | null
  fallback?: string | null
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#14372f] text-xs font-extrabold text-white">
        {ownerName(name, email, fallback).slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-po-text">{ownerName(name, email, fallback)}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-po-text-muted">{maskEmail(email)}</p>
      </div>
    </div>
  )
}

function FeatureLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="text-po-text">{value}</span>
    </div>
  )
}

function Pagination({
  page,
  pageCount,
  onPrev,
  onNext,
}: {
  page: number
  pageCount: number
  onPrev: () => void
  onNext: () => void
}) {
  if (pageCount <= 1) return null

  return (
    <div className="mt-5 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="inline-flex h-9 items-center rounded-full border border-po-border bg-white px-3 text-xs font-extrabold text-po-text-muted transition hover:text-po-primary disabled:opacity-40"
      >
        Trước
      </button>
      <span className="text-xs font-bold text-po-text-muted">
        {page}/{pageCount}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= pageCount}
        className="inline-flex h-9 items-center rounded-full border border-po-border bg-white px-3 text-xs font-extrabold text-po-text-muted transition hover:text-po-primary disabled:opacity-40"
      >
        Sau
      </button>
    </div>
  )
}

function PaymentDetailModal({
  payment,
  onClose,
}: {
  payment: AdminChatSubscriptionPaymentItemResponse
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#14372f]/45 p-4 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl shadow-emerald-950/20 ring-1 ring-po-border">
        <div className="flex items-start justify-between gap-4 border-b border-po-border px-5 py-4 md:px-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-po-primary">Chi tiết giao dịch</p>
            <h3 className="mt-1 text-xl font-extrabold text-po-text">{payment.paymentReference}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full border border-po-border text-po-text-muted transition hover:text-po-text"
            title="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
          <DetailItem label="Tên chủ tài khoản" value={ownerName(payment.ownerName, payment.ownerEmail, payment.ownerUserId)} />
          <DetailItem label="Email" value={payment.ownerEmail} />
          <DetailItem label="Số tiền" value={formatCurrency(payment.amount)} />
          <DetailItem label="Giá gốc" value={formatCurrency(payment.originalAmount)} />
          <DetailItem label="Giảm giá" value={formatCurrency(payment.discountAmount)} />
          <DetailItem label="Voucher" value={payment.voucherCode ?? "--"} />
          <DetailItem label="Gói" value={payment.planName} />
          <DetailItem label="Trạng thái" value={statusLabel(payment.status)} />
          <DetailItem label="Nhà cung cấp" value={payment.provider} />
          <DetailItem label="Mã nhà cung cấp" value={payment.providerTransactionId ?? "--"} />
          <DetailItem label="Ngày tạo" value={formatDate(payment.createdAt)} />
          <DetailItem label="Thanh toán lúc" value={formatDate(payment.paidAt)} />
          <DetailItem label="Hết hạn thanh toán" value={formatDate(payment.expiresAt)} />
          <DetailItem label="Owner ID" value={payment.ownerUserId} />
        </div>
      </section>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-po-surface-muted/45 px-4 py-3 ring-1 ring-po-border/70">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-po-text-subtle">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-po-text">{value}</p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon
  title: string
  detail: string
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-po-border bg-po-surface-muted/25 p-6 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-extrabold text-po-text">{title}</p>
      <p className="mt-1 text-xs font-semibold text-po-text-muted">{detail}</p>
    </div>
  )
}
