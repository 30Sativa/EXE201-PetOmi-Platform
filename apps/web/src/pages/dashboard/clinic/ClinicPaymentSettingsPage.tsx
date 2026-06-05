import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard, Landmark, Save, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { getErrorMessage } from "@/lib/utils"
import {
  getSePayAccountApi,
  upsertSePayAccountApi,
} from "@/services/clinic.service"

const emptyForm = {
  bankCode: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
}

export default function ClinicPaymentSettingsPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [form, setForm] = useState(emptyForm)

  const accountQuery = useQuery({
    queryKey: ["clinic", clinicId, "sepay-account"],
    queryFn: () => getSePayAccountApi(clinicId),
    enabled: Boolean(clinicId),
  })

  useEffect(() => {
    if (!accountQuery.data) return
    queueMicrotask(() => {
      setForm((current) => ({
        ...current,
        bankCode: accountQuery.data?.bankCode ?? "",
        bankName: accountQuery.data?.bankName ?? "",
        accountName: accountQuery.data?.accountName ?? "",
      }))
    })
  }, [accountQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertSePayAccountApi(clinicId, {
        bankCode: form.bankCode.trim(),
        bankName: form.bankName.trim() || null,
        accountNumber: form.accountNumber.trim(),
        accountName: form.accountName.trim() || null,
      }),
    onSuccess: async () => {
      toast.success("Đã lưu cấu hình SePay.")
      setForm((current) => ({ ...current, accountNumber: "" }))
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "sepay-account"] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể lưu cấu hình SePay.")),
  })

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={CreditCard} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi cấu hình thanh toán." />
  }

  const account = accountQuery.data
  const canSave = form.bankCode.trim() && form.accountNumber.trim()

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[26px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              Thanh toán clinic
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight text-po-text">
              Cấu hình SePay
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-po-text-muted">
              Thiết lập tài khoản nhận tiền dùng cho QR SePay và đối soát hóa đơn.
            </p>
          </div>

          <div className="grid min-h-[76px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[22px] bg-po-surface-muted/60 p-3 ring-1 ring-po-border/70 lg:w-64">
            <span className="grid size-9 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-po-text-muted">Trạng thái</p>
              <p className="mt-1 text-lg font-extrabold leading-none text-po-text">{account?.isActive ? "Active" : "Chưa sẵn sàng"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[26px] bg-white/90 p-4 ring-1 ring-po-border/80">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">Tài khoản hiện tại</h3>
              <p className="mt-1 text-xs text-po-text-muted">Backend trả số tài khoản dạng masked.</p>
            </div>
            <span className="grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
              <Landmark className="size-5" />
            </span>
          </div>

          <div className="mt-4">
            {accountQuery.isLoading ? (
              <AccountSkeleton />
            ) : account ? (
              <div className="rounded-[22px] bg-po-surface-muted/55 p-4 ring-1 ring-po-border/70">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold text-po-text">{account.bankCode}</p>
                    <p className="mt-1 text-xs text-po-text-muted">{account.bankName ?? "Chưa có tên ngân hàng"}</p>
                  </div>
                  <StatusBadge variant={account.isActive ? "success" : "warning"} label={account.isActive ? "Active" : "Inactive"} />
                </div>
                <div className="mt-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-po-border/70">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-po-text-subtle">Số tài khoản</p>
                  <p className="mt-1 font-mono text-lg font-extrabold text-po-text">{account.accountNumberMasked}</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-po-text-muted">{account.accountName ?? "Chưa có tên chủ tài khoản"}</p>
              </div>
            ) : (
              <EmptyState icon={CreditCard} title="Chưa cấu hình SePay" description="Nhập thông tin tài khoản để clinic có thể tạo QR thanh toán." className="py-8" />
            )}
          </div>
        </section>

        <section className="rounded-[26px] bg-white/90 p-4 ring-1 ring-po-border/80">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">Cập nhật tài khoản</h3>
              <p className="mt-1 text-xs text-po-text-muted">Mỗi lần lưu cần nhập lại số tài khoản đầy đủ vì màn hình không giữ số thật.</p>
            </div>
            <span className="grid size-10 place-items-center rounded-2xl bg-po-success-soft text-po-success">
              <Save className="size-5" />
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Mã ngân hàng" value={form.bankCode} onChange={(value) => setForm({ ...form, bankCode: value })} placeholder="VD: MBBANK" />
            <Input label="Tên ngân hàng" value={form.bankName} onChange={(value) => setForm({ ...form, bankName: value })} placeholder="VD: MB Bank" />
            <Input label="Số tài khoản" value={form.accountNumber} onChange={(value) => setForm({ ...form, accountNumber: value })} placeholder="Nhập số tài khoản đầy đủ" />
            <Input label="Tên chủ tài khoản" value={form.accountName} onChange={(value) => setForm({ ...form, accountName: value })} placeholder="Tên chủ tài khoản" />
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:opacity-60 active:translate-y-0"
          >
            <Save className="size-4" />
            {saveMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </section>
      </div>
    </div>
  )
}

function AccountSkeleton() {
  return (
    <div className="rounded-[22px] bg-po-surface-muted/55 p-4 ring-1 ring-po-border/70">
      <div className="h-4 w-28 animate-pulse rounded-full bg-white" />
      <div className="mt-2 h-3 w-40 animate-pulse rounded-full bg-white" />
      <div className="mt-4 h-16 animate-pulse rounded-2xl bg-white" />
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-po-text">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-subtle focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}
