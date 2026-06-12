import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  Bot,
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
import type { ChatSubscriptionPaymentResponse } from "@/types"

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
  const [error, setError] = useState<string | null>(null)

  const { data: pets = [], isLoading: isLoadingPets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  useEffect(() => {
    if (selectedPetId || pets.length === 0) return
    setSelectedPetId(pets[0].petId)
  }, [pets, selectedPetId])

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.petId === selectedPetId),
    [pets, selectedPetId],
  )

  const {
    data: subscriptionStatus,
    isLoading: isLoadingSubscription,
  } = useQuery({
    queryKey: ["owner-chat-subscription", selectedPetId || null],
    queryFn: () => getChatSubscriptionStatusApi(selectedPetId || null),
    staleTime: 30 * 1000,
  })

  const createPaymentMutation = useMutation({
    mutationFn: createChatSubscriptionPaymentApi,
    onSuccess: (payment) => {
      setPaymentRequest(payment)
      setError(null)
    },
    onError: (mutationError) => {
      setError(
        getApiErrorMessage(
          mutationError,
          "Không tạo được QR thanh toán Premium. Vui lòng thử lại sau.",
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

    setPaymentRequest(latestPayment)
    if (latestPayment.status.toLowerCase() === "paid") {
      void queryClient.invalidateQueries({
        queryKey: ["owner-chat-subscription"],
      })
    }
  }, [paymentStatusQuery.data, queryClient])

  useEffect(() => {
    if (!paymentRequest || !selectedPetId) return
    if (paymentRequest.petId !== selectedPetId) {
      setPaymentRequest(null)
    }
  }, [paymentRequest, selectedPetId])

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
  const activePremiumPets =
    subscriptionStatus?.ownerPetSubscriptions?.filter((item) => item.isUsable) ??
    []

  const handleUpgradePremium = () => {
    if (!selectedPetId) {
      setError("Chọn một bé trước khi nâng cấp Premium.")
      return
    }

    createPaymentMutation.mutate({
      planCode: "premium",
      petId: selectedPetId,
    })
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="inline-flex rounded-md bg-po-primary-soft px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-po-primary">
            PetOmi AI
          </p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight text-po-text">
            AI Plan
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-po-text-muted">
            Quản lý gói Free/Premium, quota tháng và thanh toán Premium theo
            từng thú cưng.
          </p>
        </div>

        <Link
          to="/dashboard/owner/chat"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-po-text shadow-sm ring-1 ring-po-border transition hover:-translate-y-0.5 hover:bg-po-surface-muted"
        >
          <Bot className="size-4 text-po-primary" />
          Quay lại Chat
        </Link>
      </div>

      <section className="grid gap-4 rounded-[26px] bg-white/90 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-po-text-muted">
                <PawPrint className="size-4 text-po-primary" />
                Chọn bé
              </div>
              <h3 className="mt-2 text-xl font-extrabold text-po-text">
                {selectedPet?.name ?? "Chưa chọn thú cưng"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-po-text-muted">
                Premium được gắn riêng theo từng bé để tư vấn sát hồ sơ hơn.
              </p>
            </div>

            <select
              value={selectedPetId}
              onChange={(event) => {
                setSelectedPetId(event.target.value)
                setError(null)
              }}
              disabled={isLoadingPets || pets.length === 0}
              className="h-11 min-w-[220px] rounded-2xl border border-po-border bg-white px-4 text-sm font-semibold text-po-text outline-none transition focus:border-po-primary focus:ring-[var(--po-focus-ring)] disabled:cursor-not-allowed disabled:bg-po-surface-muted"
            >
              <option value="">Chưa chọn thú cưng</option>
              {pets.map((pet) => (
                <option key={pet.petId} value={pet.petId}>
                  {pet.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] bg-po-surface-muted p-4 ring-1 ring-po-border/70">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-po-text-muted">
                Gói hiện tại
              </p>
              <p className="mt-2 text-2xl font-extrabold text-po-text">
                {isLoadingSubscription
                  ? "Đang tải..."
                  : subscriptionStatus?.currentPlanName ?? "Free"}
              </p>
              <p className="mt-1 text-xs font-semibold text-po-text-subtle">
                {subscriptionStatus?.isPremium
                  ? `Hết hạn ${formatDate(subscriptionStatus.subscriptionExpiresAt)}`
                  : "Free quota mặc định"}
              </p>
            </div>

            <div className="rounded-[22px] bg-po-primary-soft p-4 ring-1 ring-po-border/70">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-po-primary">
                Quota còn lại
              </p>
              <p className="mt-2 text-2xl font-extrabold text-po-primary">
                {subscriptionStatus
                  ? subscriptionStatus.usage.remainingMessages
                  : "--"}
              </p>
              <p className="mt-1 text-xs font-semibold text-po-text-subtle">
                / {subscriptionStatus?.usage.monthlyMessageQuota ?? "--"} tin nhắn tháng
              </p>
            </div>

            <div className="rounded-[22px] bg-po-success-soft p-4 ring-1 ring-po-border/70">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-po-success">
                Reset quota
              </p>
              <p className="mt-2 text-2xl font-extrabold text-po-success">
                {formatDate(subscriptionStatus?.usage.resetAt)}
              </p>
              <p className="mt-1 text-xs font-semibold text-po-text-subtle">
                Tự động làm mới theo chu kỳ
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-bold text-po-text-muted">
              <span>Đã dùng trong tháng</span>
              <span>{quotaPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-po-surface-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  subscriptionStatus && !subscriptionStatus.canSend
                    ? "bg-po-danger"
                    : "bg-po-primary",
                )}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
            {subscriptionStatus?.blockReason ? (
              <p className="mt-3 rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
                {subscriptionStatus.blockReason}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[22px] bg-po-surface-muted/80 p-4 ring-1 ring-po-border/70">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-po-text-muted">
            <Sparkles className="size-4 text-po-primary" />
            Khả năng hiện tại
          </div>
          <div className="mt-4 grid gap-3">
            <CapabilityRow
              icon={Database}
              label="RAG sâu"
              value={subscriptionStatus?.capabilities.deepRagEnabled ? "Có" : "Không"}
            />
            <CapabilityRow
              icon={ImageIcon}
              label="Upload ảnh"
              value={
                subscriptionStatus?.capabilities.imageUploadEnabled
                  ? `${subscriptionStatus.capabilities.maxImageUploadsPerMonth}/tháng`
                  : "Premium"
              }
            />
            <CapabilityRow
              icon={Zap}
              label="Ưu tiên xử lý"
              value={`Level ${subscriptionStatus?.capabilities.priorityLevel ?? 0}`}
            />
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardSection
          title="Chọn gói AI"
          subtitle="Free vẫn dùng được chat cơ bản. Premium mở quota và tính năng nâng cao theo từng bé."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {(subscriptionStatus?.plans ?? []).map((plan) => {
              const normalizedCode = plan.code.toLowerCase()
              const isPremium = normalizedCode === "premium"
              const isCurrent =
                normalizedCode ===
                subscriptionStatus?.currentPlanCode?.toLowerCase()

              return (
                <article
                  key={plan.planId}
                  className={cn(
                    "flex min-h-[280px] flex-col rounded-[22px] border p-5",
                    isPremium
                      ? "border-po-primary bg-po-primary-soft/45"
                      : "border-po-border bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid size-10 place-items-center rounded-2xl",
                            isPremium
                              ? "bg-po-primary text-white"
                              : "bg-po-surface-muted text-po-text-muted",
                          )}
                        >
                          {isPremium ? (
                            <Crown className="size-5" />
                          ) : (
                            <MessageSquare className="size-5" />
                          )}
                        </span>
                        <div>
                          <h4 className="text-xl font-extrabold text-po-text">
                            {plan.name}
                          </h4>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-po-text-subtle">
                            {plan.code}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-3xl font-extrabold text-po-text">
                        {formatCurrency(plan.priceMonthly)}
                      </p>
                    </div>

                    {isCurrent ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-po-primary ring-1 ring-po-border">
                        Đang dùng
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-po-text-muted">
                    {plan.description ??
                      `${plan.monthlyMessageQuota} tin nhắn trong ${plan.billingCycleDays} ngày.`}
                  </p>

                  <div className="mt-5 grid gap-2 text-sm font-semibold text-po-text-muted">
                    <PlanFeature label="Tin nhắn" value={`${plan.monthlyMessageQuota}/tháng`} />
                    <PlanFeature label="RAG sâu" value={plan.deepRagEnabled ? "Có" : "Không"} />
                    <PlanFeature
                      label="Upload ảnh"
                      value={
                        plan.imageUploadEnabled
                          ? `${plan.maxImageUploadsPerMonth}/tháng`
                          : "Không"
                      }
                    />
                  </div>

                  <div className="mt-auto pt-5">
                    {isPremium ? (
                      <button
                        type="button"
                        onClick={handleUpgradePremium}
                        disabled={
                          subscriptionStatus?.isPremium ||
                          !selectedPetId ||
                          createPaymentMutation.isPending
                        }
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-po-primary px-4 text-sm font-extrabold text-white shadow-sm shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {createPaymentMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CreditCard className="size-4" />
                        )}
                        {subscriptionStatus?.isPremium
                          ? "Premium đang hoạt động"
                          : "Nâng cấp Premium"}
                      </button>
                    ) : (
                      <div className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-po-text-muted ring-1 ring-po-border">
                        <CheckCircle2 className="size-4 text-po-success" />
                        Gói mặc định
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </DashboardSection>

        <div className="grid gap-6">
          <DashboardSection
            title="Thanh toán"
            subtitle="QR Premium sẽ tự kiểm tra trạng thái vài giây một lần."
            className="xl:sticky xl:top-6"
          >
            {paymentRequest ? (
              <div className="grid gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-po-primary">
                      SePay Premium
                    </p>
                    <h4 className="mt-1 text-lg font-extrabold text-po-text">
                      {paymentRequest.petName}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentRequest(null)}
                    className="grid size-8 place-items-center rounded-full bg-white text-po-text-muted ring-1 ring-po-border hover:text-po-text"
                    aria-label="Đóng thanh toán"
                    title="Đóng thanh toán"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {paymentRequest.status.toLowerCase() === "paid" ? (
                  <div className="rounded-2xl bg-po-success-soft px-4 py-3 text-sm font-bold text-po-success">
                    Đã thanh toán. Premium đã kích hoạt.
                  </div>
                ) : (
                  <>
                    <img
                      src={paymentRequest.qrCodeUrl}
                      alt="SePay QR"
                      className="aspect-square w-full rounded-2xl bg-white object-contain p-3 ring-1 ring-po-border"
                    />
                    <div className="grid gap-2 text-sm font-semibold text-po-text-muted">
                      <PlanFeature
                        label="Số tiền"
                        value={formatCurrency(paymentRequest.amount)}
                      />
                      <PlanFeature
                        label="Nội dung CK"
                        value={paymentRequest.paymentReference}
                      />
                      <PlanFeature
                        label="Hết hạn QR"
                        value={formatDateTime(paymentRequest.expiresAt)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => paymentStatusQuery.refetch()}
                      disabled={paymentStatusQuery.isFetching}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-3 text-xs font-extrabold text-po-text ring-1 ring-po-border transition hover:bg-po-surface-muted disabled:opacity-60"
                    >
                      {paymentStatusQuery.isFetching ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                      Kiểm tra thanh toán
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid min-h-[260px] place-items-center rounded-2xl bg-po-surface-muted/70 px-5 text-center ring-1 ring-po-border/70">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-full bg-white text-po-primary ring-1 ring-po-border">
                    <CreditCard className="size-6" />
                  </div>
                  <h4 className="mt-4 text-base font-extrabold text-po-text">
                    Chưa có QR thanh toán
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-po-text-muted">
                    Chọn thú cưng và bấm nâng cấp Premium để tạo QR.
                  </p>
                </div>
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Premium pets"
            subtitle="Các bé đang có Premium còn hiệu lực."
          >
            {activePremiumPets.length ? (
              <div className="grid gap-2">
                {activePremiumPets.map((item) => (
                  <div
                    key={item.subscriptionId}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-po-surface-muted px-3 py-3 text-sm font-semibold"
                  >
                    <span className="min-w-0 truncate text-po-text">
                      {item.petName}
                    </span>
                    <span className="shrink-0 text-po-primary">
                      đến {formatDate(item.expiresAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-po-surface-muted px-4 py-4 text-sm font-semibold leading-6 text-po-text-muted">
                Chưa có bé nào đang dùng Premium.
              </p>
            )}
          </DashboardSection>
        </div>
      </div>
    </div>
  )
}

type CapabilityIcon = typeof Database

function CapabilityRow({
  icon: Icon,
  label,
  value,
}: {
  icon: CapabilityIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold ring-1 ring-po-border/70">
      <span className="inline-flex min-w-0 items-center gap-2 text-po-text-muted">
        <Icon className="size-4 shrink-0 text-po-primary" />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-extrabold text-po-text">{value}</span>
    </div>
  )
}

function PlanFeature({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 font-extrabold text-po-text">{value}</span>
    </div>
  )
}
