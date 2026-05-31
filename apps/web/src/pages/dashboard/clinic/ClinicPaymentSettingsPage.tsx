import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard, Save } from "lucide-react"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
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
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-po-text">Cấu hình thanh toán</h2>
        <p className="mt-1 text-sm text-po-text-muted">Thiết lập tài khoản nhận tiền dùng cho QR SePay và đối soát hóa đơn.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <DashboardSection title="Tài khoản hiện tại" subtitle="Số tài khoản được backend trả về dạng masked để tránh lộ thông tin nhạy cảm.">
          {accountQuery.isLoading ? (
            <div className="py-12 text-center"><LoadingSpinner /></div>
          ) : account ? (
            <div className="rounded-2xl border border-po-border bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-po-text">{account.bankCode}</p>
                  <p className="mt-1 text-xs text-po-text-muted">{account.bankName ?? "Chưa có tên ngân hàng"}</p>
                </div>
                <StatusBadge variant={account.isActive ? "success" : "warning"} label={account.isActive ? "Active" : "Inactive"} />
              </div>
              <div className="mt-4 rounded-2xl bg-po-surface-muted px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-po-text-subtle">Số tài khoản</p>
                <p className="mt-1 text-lg font-extrabold text-po-text">{account.accountNumberMasked}</p>
              </div>
              <p className="mt-3 text-sm text-po-text-muted">{account.accountName ?? "Chưa có tên chủ tài khoản"}</p>
            </div>
          ) : (
            <EmptyState icon={CreditCard} title="Chưa cấu hình SePay" description="Nhập thông tin tài khoản để clinic có thể tạo QR thanh toán." />
          )}
        </DashboardSection>

        <DashboardSection title="Cập nhật tài khoản SePay" subtitle="Mỗi lần lưu cần nhập lại số tài khoản đầy đủ vì màn hình không giữ số thật sau khi backend mask.">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Mã ngân hàng" value={form.bankCode} onChange={(value) => setForm({ ...form, bankCode: value })} placeholder="VD: MBBANK" />
            <Input label="Tên ngân hàng" value={form.bankName} onChange={(value) => setForm({ ...form, bankName: value })} placeholder="VD: MB Bank" />
            <Input label="Số tài khoản" value={form.accountNumber} onChange={(value) => setForm({ ...form, accountNumber: value })} placeholder="Nhập số tài khoản đầy đủ" />
            <Input label="Tên chủ tài khoản" value={form.accountName} onChange={(value) => setForm({ ...form, accountName: value })} placeholder="Tên chủ tài khoản" />
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            <Save className="size-4" />
            {saveMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </DashboardSection>
      </div>
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
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-subtle focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}
