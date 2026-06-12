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
              AI subscriptions
            </div>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight text-po-text md:text-5xl">
              Quan ly goi chat AI
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-po-text-muted">
              Theo doi goi Free/Premium, subscription gan theo tung pet va cac giao dich SePay gan day.
            </p>
          </div>
          {premiumPlan ? (
            <div className="rounded-[24px] bg-po-primary-soft p-4 text-po-primary ring-1 ring-po-border/80">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em]">Premium price</p>
              <p className="mt-2 text-3xl font-extrabold">{formatCurrency(premiumPlan.priceMonthly)}</p>
              <p className="mt-1 text-xs font-bold">
                {premiumPlan.monthlyMessageQuota} messages / {premiumPlan.billingCycleDays} ngay / pet
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
            <MetricCard icon={PawPrint} label="Active subscriptions" value={activeSubscriptions.length} />
            <MetricCard icon={CreditCard} label="Pending payments" value={pendingPayments.length} />
            <MetricCard icon={ReceiptText} label="Paid payments" value={paidPayments.length} />
          </div>

          <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-po-text">Plans</h3>
                <p className="mt-1 text-sm font-medium text-po-text-muted">
                  Seed mac dinh cho owner chat. Clinic scope se dung tiep model nay sau.
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
                      label={plan.isActive ? "Active" : "Inactive"}
                      variant={plan.isActive ? "success" : "default"}
                    />
                  </div>
                  <p className="mt-4 text-2xl font-extrabold text-po-primary">
                    {formatCurrency(plan.priceMonthly)}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm font-semibold text-po-text-muted">
                    <div className="flex justify-between gap-3">
                      <span>Messages</span>
                      <span>{plan.monthlyMessageQuota}/thang</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Deep RAG</span>
                      <span>{plan.deepRagEnabled ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Image uploads</span>
                      <span>{plan.maxImageUploadsPerMonth}/thang</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
            <h3 className="text-xl font-extrabold text-po-text">Subscriptions gan day</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.1em] text-po-text-subtle">
                  <tr>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Pet</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.subscriptions ?? []).map((item) => (
                    <tr key={item.subscriptionId} className="border-t border-po-border">
                      <td className="px-3 py-3 font-semibold text-po-text">{item.ownerEmail ?? "--"}</td>
                      <td className="px-3 py-3 text-po-text-muted">{item.petName ?? item.clinicName ?? "--"}</td>
                      <td className="px-3 py-3 text-po-text-muted">{item.planName}</td>
                      <td className="px-3 py-3">
                        <StatusBadge label={item.status} variant={statusVariant(item.status)} />
                      </td>
                      <td className="px-3 py-3 text-po-text-muted">{formatDate(item.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[30px] bg-white/92 p-5 shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
            <h3 className="text-xl font-extrabold text-po-text">Payments gan day</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.1em] text-po-text-subtle">
                  <tr>
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Pet</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Created</th>
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
                        <StatusBadge label={item.status} variant={statusVariant(item.status)} />
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
