import { useEffect, useState } from "react"
import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Bot,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Database,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  PawPrint,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/format"
import { getPetsApi } from "@/services/pets.service"
import {
  createChatSubscriptionPaymentApi,
  getChatSubscriptionPaymentStatusApi,
  getChatSubscriptionStatusApi,
} from "@/services/chat-subscription.service"
import type {
  ChatSubscriptionPaymentResponse,
  ChatSubscriptionPlanResponse,
  ChatSubscriptionStatusResponse,
} from "@/types"

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      errors?: string[]
      message?: string
    } | undefined
    return data?.errors?.[0] ?? data?.message ?? fallback
  }

  return fallback
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function OwnerAiPlanPage() {
  const queryClient = useQueryClient()
  const [selectedPetId, setSelectedPetId] = useState("")
  const [paymentRequest, setPaymentRequest] =
    useState<ChatSubscriptionPaymentResponse | null>(null)

  const { data: pets = [] } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  useEffect(() => {
    if (selectedPetId || pets.length === 0) return
    setSelectedPetId(pets[0].petId)
  }, [pets, selectedPetId])

  // Gói gộp chung theo tài khoản: trạng thái/usage không phụ thuộc pet nào.
  const {
    data: subscriptionStatus,
    isLoading: isLoadingSubscription,
  } = useQuery({
    queryKey: ["owner-chat-subscription", "account"],
    queryFn: () => getChatSubscriptionStatusApi(null),
    staleTime: 30 * 1000,
  })

  const createPaymentMutation = useMutation({
    mutationFn: createChatSubscriptionPaymentApi,
    onSuccess: (payment) => {
      setPaymentRequest(payment)
      toast.success("Đã tạo mã thanh toán. Quét QR để hoàn tất nâng cấp nhé!")
    },
    onError: (mutationError) => {
      toast.error(
        getApiErrorMessage(
          mutationError,
          "Không tạo được mã thanh toán Premium. Vui lòng thử lại sau.",
        ),
      )
    },
  })

  const paymentStatusQuery = useQuery({
    queryKey: ["owner-chat-subscription-payment", paymentRequest?.paymentId],
    queryFn: () =>
      getChatSubscriptionPaymentStatusApi(paymentRequest?.paymentId ?? ""),
    enabled:
      Boolean(paymentRequest?.paymentId) &&
      paymentRequest?.status.toLowerCase() === "pending",
    refetchInterval: (query) => {
      const latestPayment = query.state.data as
        | ChatSubscriptionPaymentResponse
        | undefined
      const status = latestPayment?.status?.toLowerCase()
      return status && status !== "pending" ? false : 5000
    },
  })

  useEffect(() => {
    const latestPayment = paymentStatusQuery.data
    if (!latestPayment) return

    setPaymentRequest((prev) => {
      const justPaid =
        latestPayment.status.toLowerCase() === "paid" &&
        prev?.status.toLowerCase() !== "paid"
      if (justPaid) {
        toast.success("Đã bật Premium cho tất cả thú cưng của bạn! 🎉")
        void queryClient.invalidateQueries({
          queryKey: ["owner-chat-subscription"],
        })
      }
      return latestPayment
    })
  }, [paymentStatusQuery.data, queryClient])

  const quotaPercent = subscriptionStatus
    ? Math.min(
        100,
        Math.round(
          (subscriptionStatus.usage.usedMessages /
            Math.max(subscriptionStatus.usage.monthlyMessageQuota, 1)) *
            100,
        ),
      )
    : 0

  const handleUpgradePremium = () => {
    // Gói dùng chung cho cả tài khoản, chỉ cần gắn một bé bất kỳ để tạo thanh toán.
    const petIdForPayment = selectedPetId || pets[0]?.petId
    if (!petIdForPayment) {
      toast.error("Bạn cần thêm ít nhất một thú cưng trước khi nâng cấp.")
      return
    }

    createPaymentMutation.mutate({
      planCode: "premium",
      petId: petIdForPayment,
    })
  }

  const quotaIsBlocked = Boolean(subscriptionStatus && !subscriptionStatus.canSend)

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-po-primary-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-po-primary">
            <Sparkles className="size-3" />
            PetOmi AI
          </span>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-po-text">
            Gói AI cho thú cưng
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-po-text-muted">
            Một gói dùng chung cho tất cả thú cưng của bạn. Nâng cấp Premium để
            có thêm lượt nhắn và tính năng tư vấn nâng cao cho mọi bé.
          </p>
        </div>

        <Link
          to="/dashboard/owner/chat"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text transition hover:bg-po-surface-muted"
        >
          <Bot className="size-4 text-po-primary" />
          Quay lại Chat
        </Link>
      </div>

      {/* Hero: pet selector + current status */}
      <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-po-border/80">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-po-border/70 bg-po-surface-muted/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
              <PawPrint className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-po-text-subtle">
                Gói của bạn
              </p>
              <p className="text-base font-bold text-po-text">
                Dùng chung cho tất cả thú cưng
              </p>
            </div>
          </div>

          {pets.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-po-primary-soft px-3 py-1.5 text-xs font-semibold text-po-primary">
              <PawPrint className="size-3.5" />
              {pets.length} bé đang dùng được
            </span>
          ) : null}
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Gói hiện tại"
                value={
                  isLoadingSubscription
                    ? "Đang tải…"
                    : subscriptionStatus?.currentPlanName ?? "Free"
                }
                hint={
                  subscriptionStatus?.isPremium
                    ? `Hết hạn ${formatDate(subscriptionStatus.subscriptionExpiresAt)}`
                    : "Gói miễn phí mặc định"
                }
                tone={subscriptionStatus?.isPremium ? "primary" : "muted"}
              />
              <StatCard
                label="Lượt nhắn còn lại"
                value={
                  subscriptionStatus
                    ? String(subscriptionStatus.usage.remainingMessages)
                    : "--"
                }
                hint={`/ ${subscriptionStatus?.usage.monthlyMessageQuota ?? "--"} tin nhắn`}
                tone="primary"
              />
              <StatCard
                label="Làm mới vào"
                value={formatDate(subscriptionStatus?.usage.resetAt)}
                hint="Tự đặt lại theo chu kỳ"
                tone="success"
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-po-text-muted">
                <span>Đã dùng trong tháng</span>
                <span className={cn(quotaIsBlocked && "text-po-danger")}>
                  {quotaPercent}%
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-po-surface-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    quotaIsBlocked ? "bg-po-danger" : "bg-po-primary",
                  )}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              {subscriptionStatus?.blockReason ? (
                <p className="mt-3 rounded-xl bg-po-danger-soft px-3 py-2.5 text-sm font-semibold text-po-danger">
                  {subscriptionStatus.blockReason}
                </p>
              ) : null}
            </div>
          </div>

          {/* Capabilities */}
          <div className="rounded-2xl bg-po-surface-muted/60 p-4 ring-1 ring-po-border/60">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-po-text-subtle">
              <Sparkles className="size-3.5 text-po-primary" />
              Gói của bạn có gì
            </p>
            <div className="mt-3 grid gap-2">
              <CapabilityRow
                icon={Database}
                label="Tư vấn sâu theo hồ sơ từng bé"
                value={subscriptionStatus?.capabilities.deepRagEnabled ? "Có" : "Chưa"}
                active={subscriptionStatus?.capabilities.deepRagEnabled}
              />
              <CapabilityRow
                icon={ImageIcon}
                label="Gửi ảnh cho AI xem"
                value={
                  subscriptionStatus?.capabilities.imageUploadEnabled
                    ? `${subscriptionStatus.capabilities.maxImageUploadsPerMonth} ảnh/tháng`
                    : "Chưa"
                }
                active={subscriptionStatus?.capabilities.imageUploadEnabled}
              />
              <CapabilityRow
                icon={Zap}
                label="Tốc độ phản hồi"
                value={
                  subscriptionStatus?.capabilities.priorityLevel
                    ? "Ưu tiên"
                    : "Tiêu chuẩn"
                }
                active={Boolean(subscriptionStatus?.capabilities.priorityLevel)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Plan picker */}
      <DashboardSection
        title="Chọn gói AI"
        subtitle="Gói Free để chat cơ bản. Lên Premium thì có nhiều lượt nhắn hơn và tư vấn kỹ hơn cho tất cả các bé."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {(subscriptionStatus?.plans ?? []).map((plan) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              subscriptionStatus={subscriptionStatus}
              isUpgrading={createPaymentMutation.isPending}
              canUpgrade={pets.length > 0}
              onUpgrade={handleUpgradePremium}
            />
          ))}
          {!isLoadingSubscription && !subscriptionStatus?.plans?.length ? (
            <p className="md:col-span-2 rounded-2xl bg-po-surface-muted px-4 py-6 text-center text-sm font-semibold text-po-text-muted">
              Chưa có gói nào khả dụng.
            </p>
          ) : null}
        </div>
      </DashboardSection>

      {/* Các bé dùng chung gói */}
      <DashboardSection
        title="Những bé đang dùng gói này"
        subtitle={
          subscriptionStatus?.isPremium
            ? "Tất cả thú cưng của bạn đều được dùng Premium."
            : "Tất cả thú cưng của bạn đang dùng gói Free."
        }
      >
        {pets.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {pets.map((pet) => (
              <div
                key={pet.petId}
                className="flex items-center justify-between gap-3 rounded-2xl bg-po-surface-muted px-4 py-3"
              >
                <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-po-text">
                  {subscriptionStatus?.isPremium ? (
                    <Crown className="size-4 shrink-0 text-po-primary" />
                  ) : (
                    <PawPrint className="size-4 shrink-0 text-po-text-muted" />
                  )}
                  <span className="truncate">{pet.name}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-po-text-muted">
                  {subscriptionStatus?.isPremium ? "Premium" : "Free"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-po-surface-muted px-4 py-5 text-center text-sm font-semibold text-po-text-muted">
            Bạn chưa thêm thú cưng nào.
          </p>
        )}
      </DashboardSection>

      {/* Payment modal */}
      {paymentRequest ? (
        <PaymentModal
          payment={paymentRequest}
          isChecking={paymentStatusQuery.isFetching}
          onCheck={() => paymentStatusQuery.refetch()}
          onClose={() => setPaymentRequest(null)}
        />
      ) : null}
    </div>
  )
}

/* ----------------------------- Sub-components ----------------------------- */

type StatTone = "primary" | "success" | "muted"

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone: StatTone
}) {
  const tones: Record<StatTone, { wrap: string; label: string; value: string }> = {
    primary: {
      wrap: "bg-po-primary-soft/60 ring-po-primary/15",
      label: "text-po-primary",
      value: "text-po-primary",
    },
    success: {
      wrap: "bg-po-success-soft/60 ring-po-success/15",
      label: "text-po-success",
      value: "text-po-success",
    },
    muted: {
      wrap: "bg-po-surface-muted ring-po-border/60",
      label: "text-po-text-subtle",
      value: "text-po-text",
    },
  }
  const t = tones[tone]

  return (
    <div className={cn("rounded-2xl p-4 ring-1", t.wrap)}>
      <p className={cn("text-[11px] font-bold uppercase tracking-[0.1em]", t.label)}>
        {label}
      </p>
      <p className={cn("mt-1.5 truncate text-xl font-bold", t.value)}>{value}</p>
      <p className="mt-0.5 truncate text-xs font-medium text-po-text-subtle">{hint}</p>
    </div>
  )
}

type CapabilityIcon = typeof Database

function CapabilityRow({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: CapabilityIcon
  label: string
  value: string
  active?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-po-border/60">
      <span className="inline-flex min-w-0 items-center gap-2 font-medium text-po-text-muted">
        <Icon
          className={cn(
            "size-4 shrink-0",
            active ? "text-po-primary" : "text-po-text-subtle",
          )}
        />
        <span className="truncate">{label}</span>
      </span>
      <span
        className={cn(
          "shrink-0 text-sm font-bold",
          active ? "text-po-text" : "text-po-text-subtle",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function PlanCard({
  plan,
  subscriptionStatus,
  isUpgrading,
  canUpgrade,
  onUpgrade,
}: {
  plan: ChatSubscriptionPlanResponse
  subscriptionStatus?: ChatSubscriptionStatusResponse
  isUpgrading: boolean
  canUpgrade: boolean
  onUpgrade: () => void
}) {
  const normalizedCode = plan.code.toLowerCase()
  const isPremium = normalizedCode === "premium"
  const isCurrent =
    normalizedCode === subscriptionStatus?.currentPlanCode?.toLowerCase()
  const alreadyPremium = Boolean(subscriptionStatus?.isPremium)

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-3xl border p-5 transition",
        isPremium
          ? "border-po-primary/40 bg-po-primary-soft/30 shadow-sm shadow-orange-200/20"
          : "border-po-border bg-white",
      )}
    >
      {isPremium ? (
        <span className="absolute -top-2.5 right-5 inline-flex items-center gap-1 rounded-full bg-po-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-sm">
          <Sparkles className="size-3" />
          Phổ biến
        </span>
      ) : null}

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-2xl",
            isPremium ? "bg-po-primary text-white" : "bg-po-surface-muted text-po-text-muted",
          )}
        >
          {isPremium ? <Crown className="size-5" /> : <MessageSquare className="size-5" />}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-po-text">{plan.name}</h3>
            {isCurrent ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-po-primary ring-1 ring-po-border">
                Đang dùng
              </span>
            ) : null}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-po-text-subtle">
            {plan.code}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-po-text">
          {plan.priceMonthly > 0 ? formatCurrency(plan.priceMonthly) : "Miễn phí"}
        </span>
        {plan.priceMonthly > 0 ? (
          <span className="text-sm font-medium text-po-text-subtle">/ tháng</span>
        ) : null}
      </div>

      {plan.description ? (
        <p className="mt-2 text-sm leading-6 text-po-text-muted">{plan.description}</p>
      ) : null}

      <ul className="mt-4 grid gap-2.5 text-sm">
        <PlanFeature label={`${plan.monthlyMessageQuota} tin nhắn mỗi tháng`} included />
        <PlanFeature label="Tư vấn sâu theo hồ sơ của bé" included={plan.deepRagEnabled} />
        <PlanFeature
          label={
            plan.imageUploadEnabled
              ? `Gửi ảnh cho AI xem — ${plan.maxImageUploadsPerMonth} ảnh/tháng`
              : "Gửi ảnh cho AI xem"
          }
          included={plan.imageUploadEnabled}
        />
        <PlanFeature
          label={plan.priorityLevel > 0 ? "Phản hồi ưu tiên, nhanh hơn" : "Tốc độ phản hồi tiêu chuẩn"}
          included={plan.priorityLevel > 0}
        />
      </ul>

      <div className="mt-auto pt-5">
        {isPremium ? (
          <button
            type="button"
            onClick={onUpgrade}
            disabled={alreadyPremium || !canUpgrade || isUpgrading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-po-primary px-4 text-sm font-bold text-white shadow-sm shadow-orange-200/40 transition hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpgrading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : alreadyPremium ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {alreadyPremium
              ? "Premium đang hoạt động"
              : !canUpgrade
                ? "Thêm thú cưng để nâng cấp"
                : "Nâng cấp Premium"}
          </button>
        ) : (
          <div className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-po-surface-muted px-4 text-sm font-bold text-po-text-muted">
            <CheckCircle2 className="size-4 text-po-success" />
            Gói mặc định
          </div>
        )}
      </div>
    </article>
  )
}

function PlanFeature({ label, included }: { label: string; included?: boolean }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full",
          included ? "bg-po-success-soft text-po-success" : "bg-po-surface-muted text-po-text-subtle",
        )}
      >
        {included ? <Check className="size-3" /> : <X className="size-3" />}
      </span>
      <span className={cn(included ? "text-po-text" : "text-po-text-subtle line-through")}>
        {label}
      </span>
    </li>
  )
}

function PaymentModal({
  payment,
  isChecking,
  onCheck,
  onClose,
}: {
  payment: ChatSubscriptionPaymentResponse
  isChecking: boolean
  onCheck: () => void
  onClose: () => void
}) {
  const isPaid = payment.status.toLowerCase() === "paid"

  const handleBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 animate-dialog-in"
      onClick={handleBackdrop}
    >
      <div className="m-auto w-[min(440px,100%)] overflow-hidden rounded-3xl border border-po-border bg-white shadow-2xl shadow-black/20 animate-dialog-content-in">
        <div className="flex items-start justify-between gap-4 border-b border-po-border/70 bg-po-surface-muted/50 px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-po-primary">
              Thanh toán Premium · SePay
            </p>
            <h3 className="mt-1 text-lg font-bold text-po-text">
              Premium cho cả tài khoản
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-po-text-muted transition hover:bg-white hover:text-po-text"
            aria-label="Đóng thanh toán"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5">
          {isPaid ? (
            <div className="grid place-items-center gap-3 py-6 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-po-success-soft text-po-success">
                <CheckCircle2 className="size-7" />
              </span>
              <p className="text-base font-bold text-po-text">Thanh toán thành công</p>
              <p className="text-sm text-po-text-muted">
                Tất cả thú cưng của bạn đã được dùng Premium.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex h-10 items-center rounded-full bg-po-primary px-6 text-sm font-bold text-white transition hover:bg-po-primary-hover"
              >
                Hoàn tất
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              <p className="text-center text-sm text-po-text-muted">
                Quét mã QR bằng app ngân hàng để thanh toán. Trạng thái sẽ tự cập
                nhật sau vài giây.
              </p>
              <img
                src={payment.qrCodeUrl}
                alt="Mã QR thanh toán SePay"
                className="mx-auto aspect-square w-56 rounded-2xl bg-white object-contain p-2 ring-1 ring-po-border"
              />
              <div className="grid gap-2 rounded-2xl bg-po-surface-muted/70 p-3 text-sm">
                <DetailRow label="Số tiền" value={formatCurrency(payment.amount)} strong />
                <DetailRow label="Nội dung CK" value={payment.paymentReference} mono />
                <DetailRow label="Hết hạn QR" value={formatDateTime(payment.expiresAt)} />
              </div>
              <button
                type="button"
                onClick={onCheck}
                disabled={isChecking}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-bold text-po-text transition hover:bg-po-surface-muted disabled:opacity-60"
              >
                {isChecking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Kiểm tra thanh toán
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  strong,
  mono,
}: {
  label: string
  value: string
  strong?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 font-medium text-po-text-muted">{label}</span>
      <span
        className={cn(
          "min-w-0 truncate text-right font-bold text-po-text",
          strong && "text-po-primary",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </span>
    </div>
  )
}
