import { BadgePercent, CreditCard, Crown, Edit3, Loader2, PawPrint, Plus, ReceiptText, Trash2 } from "lucide-react"
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
import type { ChatSubscriptionVoucherRequest, ChatSubscriptionVoucherResponse } from "@/types"

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
  "h-10 w-full rounded-xl border border-po-border bg-white px-3 text-sm font-semibold text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/15"

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

export default function AdminChatSubscriptionsPage() {
  const queryClient = useQueryClient()
  const [voucherForm, setVoucherForm] = useState<VoucherFormState>(emptyVoucherForm)
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "chat-subscriptions"],
    queryFn: () => getAdminChatSubscriptionsApi(80),
    refetchOnMount: "always",
  })

  const saveVoucherMutation = useMutation({
    mutationFn: (request: ChatSubscriptionVoucherRequest) =>
      editingVoucherId
        ? updateAdminChatSubscriptionVoucherApi(editingVoucherId, request)
        : createAdminChatSubscriptionVoucherApi(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "chat-subscriptions"] })
      toast.success(editingVoucherId ? "Đã cập nhật voucher." : "Đã tạo voucher.")
      setVoucherForm(emptyVoucherForm)
      setEditingVoucherId(null)
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
      if (editingVoucherId === voucherId) resetVoucherForm()
      toast.success("Đã xóa voucher.")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không xóa được voucher.")
    },
  })

  const premiumPlan = data?.plans.find((plan) => plan.code === "premium")
  const activeSubscriptions = data?.subscriptions.filter((item) => item.isActive) ?? []
  const pendingPayments = data?.payments.filter((item) => item.status.toLowerCase() === "pending") ?? []
  const paidPayments = data?.payments.filter((item) => item.status.toLowerCase() === "paid") ?? []
  const vouchers = data?.vouchers ?? []

  const resetVoucherForm = () => {
    setVoucherForm(emptyVoucherForm)
    setEditingVoucherId(null)
  }

  const handleVoucherSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveVoucherMutation.mutate(buildVoucherRequest(voucherForm))
  }

  const handleEditVoucher = (voucher: ChatSubscriptionVoucherResponse) => {
    setEditingVoucherId(voucher.voucherId)
    setVoucherForm(voucherToForm(voucher))
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
    <div className="grid gap-5">
      <section className="rounded-[30px] bg-white/94 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 md:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-po-primary">
              <span className="grid size-7 place-items-center rounded-xl bg-po-primary-soft ring-1 ring-po-border/80">
                <Crown className="size-3.5" />
              </span>
              Gói chat AI
            </div>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight text-po-text md:text-5xl">
              Quản lý gói chat AI
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-po-text-muted">
              Theo dõi gói Miễn phí / Premium, gói đăng ký gắn theo từng thú cưng và các giao dịch
              thanh toán gần đây.
            </p>
          </div>
          {premiumPlan ? (
            <div className="rounded-[24px] bg-po-primary-soft p-4 text-po-primary ring-1 ring-po-border/80">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em]">Giá Premium</p>
              <p className="mt-2 text-3xl font-extrabold">{formatCurrency(premiumPlan.priceMonthly)}</p>
              <p className="mt-1 text-xs font-bold">
                {premiumPlan.monthlyMessageQuota} tin nhắn / {premiumPlan.billingCycleDays} ngày / thú cưng
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
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard icon={PawPrint} label="Gói đang hoạt động" value={activeSubscriptions.length} />
            <MetricCard icon={CreditCard} label="Chờ thanh toán" value={pendingPayments.length} />
            <MetricCard icon={ReceiptText} label="Đã thanh toán" value={paidPayments.length} />
          </div>

          <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-extrabold text-po-text">
                  <BadgePercent className="size-5 text-po-primary" />
                  Voucher Premium
                </h3>
                <p className="mt-1 text-sm font-medium text-po-text-muted">
                  Tạo mã giảm giá cho chủ thú cưng khi mua gói PetOmi AI Premium.
                </p>
              </div>
              {editingVoucherId ? (
                <button
                  type="button"
                  onClick={resetVoucherForm}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-po-border bg-white px-4 text-sm font-bold text-po-text transition hover:bg-po-surface-muted"
                >
                  Tạo mã mới
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
              <form onSubmit={handleVoucherSubmit} className="grid gap-3 rounded-2xl border border-po-border bg-po-surface-muted/45 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Mã voucher">
                    <input
                      value={voucherForm.code}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                      maxLength={40}
                      required
                      placeholder="PETOMI20"
                      className={voucherInputClass}
                    />
                  </Field>
                  <Field label="Tên">
                    <input
                      value={voucherForm.name}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, name: event.target.value }))}
                      maxLength={120}
                      required
                      placeholder="Ưu đãi tháng này"
                      className={voucherInputClass}
                    />
                  </Field>
                </div>

                <Field label="Mô tả">
                  <input
                    value={voucherForm.description}
                    onChange={(event) => setVoucherForm((prev) => ({ ...prev, description: event.target.value }))}
                    maxLength={300}
                    placeholder="Hiển thị nội bộ cho admin"
                    className={voucherInputClass}
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Kiểu giảm">
                    <select
                      value={voucherForm.discountType}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, discountType: event.target.value as "Percent" | "FixedAmount" }))}
                      className={voucherInputClass}
                    >
                      <option value="Percent">Phần trăm</option>
                      <option value="FixedAmount">Số tiền</option>
                    </select>
                  </Field>
                  <Field label={voucherForm.discountType === "Percent" ? "Giảm (%)" : "Giảm (VND)"}>
                    <input
                      type="number"
                      min="1"
                      max={voucherForm.discountType === "Percent" ? 90 : undefined}
                      value={voucherForm.discountValue}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, discountValue: event.target.value }))}
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
                      value={voucherForm.maxDiscountAmount}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
                      placeholder="Không giới hạn"
                      className={voucherInputClass}
                    />
                  </Field>
                  <Field label="Đơn tối thiểu">
                    <input
                      type="number"
                      min="0"
                      value={voucherForm.minOrderAmount}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
                      className={voucherInputClass}
                    />
                  </Field>
                  <Field label="Lượt dùng">
                    <input
                      type="number"
                      min="1"
                      value={voucherForm.usageLimit}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
                      placeholder="Không giới hạn"
                      className={voucherInputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-3">
                  <Field label="Bắt đầu">
                    <input
                      type="datetime-local"
                      value={voucherForm.startsAt}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                      min={startsAtMin}
                      className={voucherInputClass}
                    />
                  </Field>
                  <Field label="Hết hạn">
                    <input
                      type="datetime-local"
                      value={voucherForm.expiresAt}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
                      min={expiresAtMin}
                      disabled={voucherForm.neverExpires}
                      className={voucherInputClass}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-po-text ring-1 ring-po-border/70">
                  <input
                    type="checkbox"
                    checked={voucherForm.neverExpires}
                    onChange={(event) => setVoucherForm((prev) => ({
                      ...prev,
                      neverExpires: event.target.checked,
                      expiresAt: event.target.checked ? "" : prev.expiresAt,
                    }))}
                    className="size-4 accent-po-primary"
                  />
                  Không bao giờ hết hạn
                </label>

                <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-po-text ring-1 ring-po-border/70">
                  <input
                    type="checkbox"
                    checked={voucherForm.isActive}
                    onChange={(event) => setVoucherForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                    className="size-4 accent-po-primary"
                  />
                  Đang bật voucher
                </label>

                <button
                  type="submit"
                  disabled={saveVoucherMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-bold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
                >
                  {saveVoucherMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {editingVoucherId ? "Lưu voucher" : "Tạo voucher"}
                </button>
              </form>

              <div className="overflow-x-auto rounded-2xl border border-po-border bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-po-surface-muted/60 text-xs uppercase tracking-[0.1em] text-po-text-subtle">
                    <tr>
                      <th className="px-3 py-3">Mã</th>
                      <th className="px-3 py-3">Giảm</th>
                      <th className="px-3 py-3">Lượt dùng</th>
                      <th className="px-3 py-3">Thời hạn</th>
                      <th className="px-3 py-3">Trạng thái</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((voucher) => (
                      <tr key={voucher.voucherId} className="border-t border-po-border">
                        <td className="px-3 py-3">
                          <p className="font-extrabold text-po-primary">{voucher.code}</p>
                          <p className="text-xs font-semibold text-po-text-muted">{voucher.name}</p>
                        </td>
                        <td className="px-3 py-3 font-semibold text-po-text">
                          {voucher.discountType === "Percent"
                            ? `${voucher.discountValue}%`
                            : formatCurrency(voucher.discountValue)}
                        </td>
                        <td className="px-3 py-3 text-po-text-muted">
                          {voucher.usedCount}/{voucher.usageLimit ?? "∞"}
                        </td>
                        <td className="px-3 py-3 text-po-text-muted">
                          {voucher.expiresAt ? formatDate(voucher.expiresAt) : "Không hết hạn"}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge label={voucher.isActive ? "Đang bật" : "Đã tắt"} variant={voucher.isActive ? "success" : "default"} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditVoucher(voucher)}
                              className="inline-flex size-9 items-center justify-center rounded-full border border-po-border bg-white text-po-text-muted transition hover:text-po-primary"
                              title="Sửa voucher"
                            >
                              <Edit3 className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleVoucherMutation.mutate({ voucherId: voucher.voucherId, isActive: !voucher.isActive })}
                              disabled={toggleVoucherMutation.isPending}
                              className="inline-flex h-9 items-center rounded-full bg-po-surface-muted px-3 text-xs font-bold text-po-text-muted transition hover:bg-po-primary-soft hover:text-po-primary disabled:opacity-60"
                            >
                              {voucher.isActive ? "Tắt" : "Bật"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVoucher(voucher)}
                              disabled={deleteVoucherMutation.isPending}
                              className="inline-flex size-9 items-center justify-center rounded-full border border-po-border bg-white text-po-text-muted transition hover:border-po-danger/40 hover:text-po-danger disabled:opacity-60"
                              title="Xóa voucher chưa có giao dịch"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!vouchers.length ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-sm font-semibold text-po-text-muted">
                          Chưa có voucher nào.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-po-text">Các gói dịch vụ</h3>
                <p className="mt-1 text-sm font-medium text-po-text-muted">
                  Gói mặc định dành cho chủ thú cưng chat với AI.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(data?.plans ?? []).map((plan) => (
                <article key={plan.planId} className="rounded-[22px] border border-po-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-extrabold text-po-text">{plan.name}</h4>
                      <p className="mt-1 text-sm font-semibold text-po-text-muted">{plan.code}</p>
                    </div>
                    <StatusBadge
                      label={plan.isActive ? "Đang bật" : "Đã tắt"}
                      variant={plan.isActive ? "success" : "default"}
                    />
                  </div>
                  <p className="mt-4 text-2xl font-extrabold text-po-primary">
                    {formatCurrency(plan.priceMonthly)}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm font-semibold text-po-text-muted">
                    <div className="flex justify-between gap-3">
                      <span>Số tin nhắn</span>
                      <span>{plan.monthlyMessageQuota}/tháng</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Tư vấn chuyên sâu</span>
                      <span>{plan.deepRagEnabled ? "Có" : "Không"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Gửi ảnh</span>
                      <span>{plan.maxImageUploadsPerMonth}/tháng</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
            <h3 className="text-xl font-extrabold text-po-text">Gói đăng ký gần đây</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.1em] text-po-text-subtle">
                  <tr>
                    <th className="px-3 py-2">Chủ thú cưng</th>
                    <th className="px-3 py-2">Thú cưng</th>
                    <th className="px-3 py-2">Gói</th>
                    <th className="px-3 py-2">Trạng thái</th>
                    <th className="px-3 py-2">Hết hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.subscriptions ?? []).map((item) => (
                    <tr key={item.subscriptionId} className="border-t border-po-border">
                      <td className="px-3 py-3 font-semibold text-po-text">{item.ownerEmail ?? "--"}</td>
                      <td className="px-3 py-3 text-po-text-muted">{item.petName ?? item.clinicName ?? "--"}</td>
                      <td className="px-3 py-3 text-po-text-muted">{item.planName}</td>
                      <td className="px-3 py-3">
                        <StatusBadge label={statusLabel(item.status)} variant={statusVariant(item.status)} />
                      </td>
                      <td className="px-3 py-3 text-po-text-muted">{formatDate(item.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
            <h3 className="text-xl font-extrabold text-po-text">Giao dịch gần đây</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.1em] text-po-text-subtle">
                  <tr>
                    <th className="px-3 py-2">Mã giao dịch</th>
                    <th className="px-3 py-2">Chủ thú cưng</th>
                    <th className="px-3 py-2">Thú cưng</th>
                    <th className="px-3 py-2">Số tiền</th>
                    <th className="px-3 py-2">Voucher</th>
                    <th className="px-3 py-2">Trạng thái</th>
                    <th className="px-3 py-2">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.payments ?? []).map((item) => (
                    <tr key={item.paymentId} className="border-t border-po-border">
                      <td className="px-3 py-3 font-extrabold text-po-primary">{item.paymentReference}</td>
                      <td className="px-3 py-3 text-po-text-muted">{item.ownerEmail}</td>
                      <td className="px-3 py-3 text-po-text-muted">{item.petName}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-po-text">{formatCurrency(item.amount)}</p>
                        {(item.discountAmount ?? 0) > 0 ? (
                          <p className="text-xs font-semibold text-po-success">
                            Giảm {formatCurrency(item.discountAmount)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-po-text-muted">{item.voucherCode ?? "--"}</td>
                      <td className="px-3 py-3">
                        <StatusBadge label={statusLabel(item.status)} variant={statusVariant(item.status)} />
                      </td>
                      <td className="px-3 py-3 text-po-text-muted">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <article className="rounded-[26px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <Icon className="size-5" />
        </span>
        <span className="text-3xl font-extrabold text-po-text">{value}</span>
      </div>
      <p className="mt-4 text-sm font-bold text-po-text-muted">{label}</p>
    </article>
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
