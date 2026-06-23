import { CreditCard, Crown, Loader2, PawPrint, ReceiptText } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import StatusBadge from "@/components/ui/StatusBadge"
import { getAdminChatSubscriptionsApi } from "@/services/chat-subscription.service"

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

export default function AdminChatSubscriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "chat-subscriptions"],
    queryFn: () => getAdminChatSubscriptionsApi(80),
    refetchOnMount: "always",
  })

  const premiumPlan = data?.plans.find((plan) => plan.code === "premium")
  const activeSubscriptions = data?.subscriptions.filter((item) => item.isActive) ?? []
  const pendingPayments = data?.payments.filter((item) => item.status.toLowerCase() === "pending") ?? []
  const paidPayments = data?.payments.filter((item) => item.status.toLowerCase() === "paid") ?? []

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
                      <td className="px-3 py-3 font-semibold text-po-text">{formatCurrency(item.amount)}</td>
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
