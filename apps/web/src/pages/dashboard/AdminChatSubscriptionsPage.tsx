import {
  BadgePercent,
  Clock3,
  Crown,
  Edit3,
  Eye,
  Layers3,
  Loader2,
  Plus,
  ReceiptText,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { toast } from "sonner"

import StatusBadge from "@/components/ui/StatusBadge"
import {
  createAdminChatSubscriptionVoucherApi,
  deleteAdminChatSubscriptionVoucherApi,
  getAdminChatSubscriptionsApi,
  toggleAdminChatSubscriptionVoucherApi,
  updateAdminChatSubscriptionVoucherApi,
} from "@/services/chat-subscription.service"
import type {
  AdminChatSubscriptionItemResponse,
  AdminChatSubscriptionPaymentItemResponse,
  ChatSubscriptionPlanResponse,
  ChatSubscriptionVoucherRequest,
  ChatSubscriptionVoucherResponse,
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

type VoucherFormState = {
  code: string
  name: string
  description: string
  discountType: "Percent" | "FixedAmount"
  discountValue: string
  maxDiscountAmount: string
  minOrderAmount: string
  usageLimit: string
  startsAt: string
  expiresAt: string
  neverExpires: boolean
  isActive: boolean
}

const emptyVoucherForm: VoucherFormState = {
  code: "",
  name: "",
  description: "",
  discountType: "Percent",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: "0",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
  neverExpires: false,
  isActive: true,
}

const toDatetimeInput = (value?: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const toApiDate = (value: string) => (value ? new Date(value).toISOString() : null)

const localDatetimeNow = () => toDatetimeInput(new Date().toISOString())

const voucherInputClass =
  "h-11 w-full rounded-2xl border border-po-border bg-white px-3 text-sm font-semibold text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/15 disabled:bg-po-surface-muted disabled:text-po-text-subtle"

const buildVoucherRequest = (form: VoucherFormState): ChatSubscriptionVoucherRequest => ({
  code: form.code.trim().toUpperCase(),
  name: form.name.trim(),
  description: form.description.trim() || null,
  discountType: form.discountType,
  discountValue: Number(form.discountValue || 0),
  maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
  minOrderAmount: Number(form.minOrderAmount || 0),
  usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
  startsAt: toApiDate(form.startsAt),
  expiresAt: form.neverExpires ? null : toApiDate(form.expiresAt),
  isActive: form.isActive,
})

const voucherToForm = (voucher: ChatSubscriptionVoucherResponse): VoucherFormState => ({
  code: voucher.code,
  name: voucher.name,
  description: voucher.description ?? "",
  discountType: voucher.discountType,
  discountValue: String(voucher.discountValue),
  maxDiscountAmount: voucher.maxDiscountAmount ? String(voucher.maxDiscountAmount) : "",
  minOrderAmount: String(voucher.minOrderAmount ?? 0),
  usageLimit: voucher.usageLimit ? String(voucher.usageLimit) : "",
  startsAt: toDatetimeInput(voucher.startsAt),
  expiresAt: toDatetimeInput(voucher.expiresAt),
  neverExpires: !voucher.expiresAt,
  isActive: voucher.isActive,
})

const ownerName = (name?: string | null, email?: string | null, fallback?: string | null) =>
  name?.trim() || email?.split("@")[0] || (fallback ? `KH-${fallback.slice(0, 6).toUpperCase()}` : "Khách hàng")

const subscriptionPageSize = 6
const paymentPageSize = 8

export default function AdminChatSubscriptionsPage() {
  const queryClient = useQueryClient()
  const [voucherForm, setVoucherForm] = useState<VoucherFormState>(emptyVoucherForm)
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const [subscriptionPage, setSubscriptionPage] = useState(1)
  const [paymentPage, setPaymentPage] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState<AdminChatSubscriptionPaymentItemResponse | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "chat-subscriptions"],
    queryFn: () => getAdminChatSubscriptionsApi(80),
    refetchOnMount: "always",
  })

  const closeVoucherModal = () => {
    setVoucherForm(emptyVoucherForm)
    setEditingVoucherId(null)
    setIsVoucherModalOpen(false)
  }

  const saveVoucherMutation = useMutation({
    mutationFn: (request: ChatSubscriptionVoucherRequest) =>
      editingVoucherId
        ? updateAdminChatSubscriptionVoucherApi(editingVoucherId, request)
        : createAdminChatSubscriptionVoucherApi(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "chat-subscriptions"] })
      toast.success(editingVoucherId ? "Đã cập nhật voucher." : "Đã tạo voucher.")
      closeVoucherModal()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không lưu được voucher.")
    },
  })

  const toggleVoucherMutation = useMutation({
    mutationFn: ({ voucherId, isActive }: { voucherId: string; isActive: boolean }) =>
      toggleAdminChatSubscriptionVoucherApi(voucherId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "chat-subscriptions"] })
      toast.success("Đã cập nhật trạng thái voucher.")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không cập nhật được voucher.")
    },
  })

  const deleteVoucherMutation = useMutation({
    mutationFn: deleteAdminChatSubscriptionVoucherApi,
    onSuccess: async (_, voucherId) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "chat-subscriptions"] })
      if (editingVoucherId === voucherId) closeVoucherModal()
      toast.success("Đã xóa voucher.")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không xóa được voucher.")
    },
  })

  const plans = data?.plans ?? []
  const premiumPlan = plans.find((plan) => plan.code.toLowerCase() === "premium")
  const subscriptions = data?.subscriptions ?? []
  const payments = data?.payments ?? []
  const vouchers = data?.vouchers ?? []
  const activeSubscriptions = subscriptions.filter((item) => item.isActive)
  const pendingPayments = payments.filter((item) => item.status.toLowerCase() === "pending")
  const paidPayments = payments.filter((item) => item.status.toLowerCase() === "paid")
  const paidRevenue = paidPayments.reduce((total, item) => total + item.amount, 0)
  const voucherUsage = vouchers.reduce((total, item) => total + item.usedCount, 0)

  const subscriptionPageCount = Math.max(1, Math.ceil(subscriptions.length / subscriptionPageSize))
  const currentSubscriptionPage = Math.min(subscriptionPage, subscriptionPageCount)
  const visibleSubscriptions = subscriptions.slice(
    (currentSubscriptionPage - 1) * subscriptionPageSize,
    currentSubscriptionPage * subscriptionPageSize,
  )

  const paymentPageCount = Math.max(1, Math.ceil(payments.length / paymentPageSize))
  const currentPaymentPage = Math.min(paymentPage, paymentPageCount)
  const visiblePayments = payments.slice(
    (currentPaymentPage - 1) * paymentPageSize,
    currentPaymentPage * paymentPageSize,
  )

  const openCreateVoucher = () => {
    setVoucherForm(emptyVoucherForm)
    setEditingVoucherId(null)
    setIsVoucherModalOpen(true)
  }

  const handleVoucherSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveVoucherMutation.mutate(buildVoucherRequest(voucherForm))
  }

  const handleEditVoucher = (voucher: ChatSubscriptionVoucherResponse) => {
    setEditingVoucherId(voucher.voucherId)
    setVoucherForm(voucherToForm(voucher))
    setIsVoucherModalOpen(true)
  }

  const handleDeleteVoucher = (voucher: ChatSubscriptionVoucherResponse) => {
    const confirmed = window.confirm(
      `Xóa voucher ${voucher.code}? Voucher đã có giao dịch không thể xóa, chỉ có thể tắt.`,
    )
    if (confirmed) deleteVoucherMutation.mutate(voucher.voucherId)
  }

  const datetimeMin = localDatetimeNow()
  const startsAtMin = voucherForm.startsAt && voucherForm.startsAt < datetimeMin
    ? voucherForm.startsAt
    : datetimeMin
  const expiresAtMin = voucherForm.expiresAt && voucherForm.expiresAt < datetimeMin
    ? voucherForm.expiresAt
    : voucherForm.startsAt || datetimeMin

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
              Theo dõi thanh toán, voucher và trạng thái đăng ký theo tài khoản chủ nuôi.
            </p>
          </div>

          {premiumPlan ? (
            <div className="rounded-[22px] bg-white/10 p-4 ring-1 ring-white/12">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-50/65">Giá Premium</p>
              <p className="mt-2 text-3xl font-extrabold text-[#ffad78]">{formatCurrency(premiumPlan.priceMonthly)}</p>
              <p className="mt-1 text-xs font-bold text-emerald-50/70">
                {premiumPlan.monthlyMessageQuota} tin nhắn trong {premiumPlan.billingCycleDays} ngày
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
            <MetricCard icon={BadgePercent} label="Voucher đã dùng" value={voucherUsage} detail={`${vouchers.filter((item) => item.isActive).length} mã đang bật`} />
          </div>

          <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary ring-1 ring-orange-100">
                  <BadgePercent className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-po-text">Voucher Premium</h3>
                  <p className="mt-1 text-sm font-medium text-po-text-muted">
                    Tạo, bật tắt và theo dõi lượt dùng mã ưu đãi Premium.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openCreateVoucher}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-extrabold text-white transition hover:bg-po-primary-hover"
              >
                <Plus className="size-4" />
                Tạo voucher
              </button>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {vouchers.map((voucher) => (
                <VoucherCard
                  key={voucher.voucherId}
                  voucher={voucher}
                  onEdit={() => handleEditVoucher(voucher)}
                  onDelete={() => handleDeleteVoucher(voucher)}
                  onToggle={() => toggleVoucherMutation.mutate({ voucherId: voucher.voucherId, isActive: !voucher.isActive })}
                  isMutating={toggleVoucherMutation.isPending || deleteVoucherMutation.isPending}
                />
              ))}
              {!vouchers.length ? (
                <EmptyState icon={Tag} title="Chưa có voucher" detail="Chưa có mã ưu đãi Premium trong dữ liệu." />
              ) : null}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="rounded-[28px] bg-white p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 md:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary ring-1 ring-orange-100">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-po-text">Các gói dịch vụ</h3>
                  <p className="mt-1 text-sm font-medium text-po-text-muted">Cấu hình Free/Premium theo tài khoản.</p>
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
              <div className="rounded-2xl bg-po-primary-soft px-4 py-3 text-sm font-extrabold text-po-primary ring-1 ring-orange-100">
                {formatCurrency(paidRevenue)}
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

      {isVoucherModalOpen ? (
        <VoucherModal
          form={voucherForm}
          setForm={setVoucherForm}
          editing={Boolean(editingVoucherId)}
          isSaving={saveVoucherMutation.isPending}
          startsAtMin={startsAtMin}
          expiresAtMin={expiresAtMin}
          onClose={closeVoucherModal}
          onSubmit={handleVoucherSubmit}
        />
      ) : null}

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
        <FeatureLine label="Tin nhắn" value={`${plan.monthlyMessageQuota}/tháng`} />
        <FeatureLine label="Tư vấn chuyên sâu" value={plan.deepRagEnabled ? "Có" : "Không"} />
        <FeatureLine label="Gửi ảnh" value={plan.imageUploadEnabled ? `${plan.maxImageUploadsPerMonth}/tháng` : "Không"} />
        <FeatureLine label="Mức ưu tiên" value={String(plan.priorityLevel)} />
      </div>
    </article>
  )
}

function VoucherCard({
  voucher,
  onEdit,
  onDelete,
  onToggle,
  isMutating,
}: {
  voucher: ChatSubscriptionVoucherResponse
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  isMutating: boolean
}) {
  const discount = voucher.discountType === "Percent"
    ? `${voucher.discountValue}%`
    : formatCurrency(voucher.discountValue)
  const usage = `${voucher.usedCount}/${voucher.usageLimit ?? "∞"}`

  return (
    <article className="rounded-[22px] border border-po-border bg-po-surface-muted/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-po-primary">{voucher.code}</p>
          <p className="mt-1 truncate text-sm font-bold text-po-text">{voucher.name}</p>
          {voucher.description ? (
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-po-text-muted">{voucher.description}</p>
          ) : null}
        </div>
        <StatusBadge label={voucher.isActive ? "Đang bật" : "Đã tắt"} variant={voucher.isActive ? "success" : "default"} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <MiniInfo label="Giảm" value={discount} />
        <MiniInfo label="Đã dùng" value={usage} />
        <MiniInfo label="Hết hạn" value={voucher.expiresAt ? formatDate(voucher.expiresAt) : "Không hạn"} />
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex size-9 items-center justify-center rounded-full border border-po-border bg-white text-po-text-muted transition hover:text-po-primary"
          title="Sửa voucher"
        >
          <Edit3 className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={isMutating}
          className="inline-flex h-9 items-center rounded-full bg-white px-3 text-xs font-bold text-po-text-muted ring-1 ring-po-border transition hover:bg-po-primary-soft hover:text-po-primary disabled:opacity-60"
        >
          {voucher.isActive ? "Tắt" : "Bật"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isMutating}
          className="inline-flex size-9 items-center justify-center rounded-full border border-po-border bg-white text-po-text-muted transition hover:border-po-danger/40 hover:text-po-danger disabled:opacity-60"
          title="Xóa voucher chưa có giao dịch"
        >
          <Trash2 className="size-4" />
        </button>
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
        <p className="mt-0.5 truncate text-xs font-semibold text-po-text-muted">{email ?? "--"}</p>
      </div>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-po-border/70">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-po-text-subtle">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold text-po-text">{value}</p>
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

function VoucherModal({
  form,
  setForm,
  editing,
  isSaving,
  startsAtMin,
  expiresAtMin,
  onClose,
  onSubmit,
}: {
  form: VoucherFormState
  setForm: (updater: (prev: VoucherFormState) => VoucherFormState) => void
  editing: boolean
  isSaving: boolean
  startsAtMin: string
  expiresAtMin: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#14372f]/45 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl shadow-emerald-950/20 ring-1 ring-po-border"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-po-border bg-white/95 px-5 py-4 backdrop-blur md:px-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-po-primary">Voucher Premium</p>
            <h3 className="mt-1 text-xl font-extrabold text-po-text">
              {editing ? "Sửa voucher" : "Tạo voucher mới"}
            </h3>
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

        <div className="grid gap-4 p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mã voucher">
              <input
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                maxLength={40}
                required
                placeholder="PETOMI20"
                className={voucherInputClass}
              />
            </Field>
            <Field label="Tên">
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                maxLength={120}
                required
                placeholder="Ưu đãi tháng này"
                className={voucherInputClass}
              />
            </Field>
          </div>

          <Field label="Mô tả nội bộ">
            <input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              maxLength={300}
              placeholder="Ghi chú cho admin"
              className={voucherInputClass}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kiểu giảm">
              <select
                value={form.discountType}
                onChange={(event) => setForm((prev) => ({ ...prev, discountType: event.target.value as "Percent" | "FixedAmount" }))}
                className={voucherInputClass}
              >
                <option value="Percent">Phần trăm</option>
                <option value="FixedAmount">Số tiền</option>
              </select>
            </Field>
            <Field label={form.discountType === "Percent" ? "Giảm (%)" : "Giảm (VND)"}>
              <input
                type="number"
                min="1"
                max={form.discountType === "Percent" ? 90 : undefined}
                value={form.discountValue}
                onChange={(event) => setForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                required
                className={voucherInputClass}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Giảm tối đa">
              <input
                type="number"
                min="0"
                value={form.maxDiscountAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
                placeholder="Không giới hạn"
                className={voucherInputClass}
              />
            </Field>
            <Field label="Đơn tối thiểu">
              <input
                type="number"
                min="0"
                value={form.minOrderAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
                className={voucherInputClass}
              />
            </Field>
            <Field label="Lượt dùng">
              <input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
                placeholder="Không giới hạn"
                className={voucherInputClass}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bắt đầu">
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                min={startsAtMin}
                className={voucherInputClass}
              />
            </Field>
            <Field label="Hết hạn">
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
                min={expiresAtMin}
                disabled={form.neverExpires}
                className={voucherInputClass}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-2xl bg-po-surface-muted/45 px-3 py-3 text-sm font-bold text-po-text ring-1 ring-po-border/70">
              <input
                type="checkbox"
                checked={form.neverExpires}
                onChange={(event) => setForm((prev) => ({
                  ...prev,
                  neverExpires: event.target.checked,
                  expiresAt: event.target.checked ? "" : prev.expiresAt,
                }))}
                className="size-4 accent-po-primary"
              />
              Không bao giờ hết hạn
            </label>

            <label className="flex items-center gap-2 rounded-2xl bg-po-surface-muted/45 px-3 py-3 text-sm font-bold text-po-text ring-1 ring-po-border/70">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                className="size-4 accent-po-primary"
              />
              Đang bật voucher
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-po-border bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-po-border bg-white px-5 text-sm font-extrabold text-po-text-muted transition hover:text-po-text"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-extrabold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {editing ? "Lưu voucher" : "Tạo voucher"}
          </button>
        </div>
      </form>
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

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-po-text-subtle">
        {label}
      </span>
      {children}
    </label>
  )
}
