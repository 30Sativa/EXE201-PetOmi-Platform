import {
  BadgePercent,
  CalendarClock,
  Edit3,
  Loader2,
  Plus,
  Power,
  Search,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { toast } from "sonner"

import StatusBadge from "@/components/ui/StatusBadge"
import SelectMenu from "@/components/ui/SelectMenu"
import {
  createAdminChatSubscriptionVoucherApi,
  deleteAdminChatSubscriptionVoucherApi,
  getAdminChatSubscriptionVouchersApi,
  toggleAdminChatSubscriptionVoucherApi,
  updateAdminChatSubscriptionVoucherApi,
} from "@/services/chat-subscription.service"
import type { ChatSubscriptionVoucherRequest, ChatSubscriptionVoucherResponse } from "@/types"

type VoucherFilter = "all" | "active" | "inactive"

const voucherFilterOptions: Array<{ value: VoucherFilter; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang bật" },
  { value: "inactive", label: "Đã tắt" },
]

const discountTypeOptions: Array<{
  value: VoucherFormState["discountType"]
  label: string
}> = [
  { value: "Percent", label: "Phần trăm" },
  { value: "FixedAmount", label: "Số tiền" },
]

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

const pageSize = 8

const inputClass =
  "h-11 w-full rounded-2xl border border-po-border bg-white px-3 text-sm font-semibold text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/15 disabled:bg-po-surface-muted disabled:text-po-text-subtle"

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0)

const formatDate = (value?: string | null) => {
  if (!value) return "Không giới hạn"
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

const toDatetimeInput = (value?: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const localDatetimeNow = () => toDatetimeInput(new Date().toISOString())
const toApiDate = (value: string) => (value ? new Date(value).toISOString() : null)

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

function voucherStatus(voucher: ChatSubscriptionVoucherResponse) {
  if (!voucher.isActive) return { label: "Đã tắt", variant: "default" as const }
  return { label: "Đang bật", variant: "success" as const }
}

export default function AdminChatVouchersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<VoucherFilter>("all")
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<VoucherFormState>(emptyVoucherForm)
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["admin", "chat-vouchers"],
    queryFn: () => getAdminChatSubscriptionVouchersApi(200),
    refetchOnMount: "always",
  })

  const closeModal = () => {
    setForm(emptyVoucherForm)
    setEditingVoucherId(null)
    setIsModalOpen(false)
  }

  const refreshVoucherData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "chat-vouchers"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "chat-subscriptions"] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: (request: ChatSubscriptionVoucherRequest) =>
      editingVoucherId
        ? updateAdminChatSubscriptionVoucherApi(editingVoucherId, request)
        : createAdminChatSubscriptionVoucherApi(request),
    onSuccess: async () => {
      await refreshVoucherData()
      toast.success(editingVoucherId ? "Đã cập nhật voucher." : "Đã tạo voucher.")
      closeModal()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Không lưu được voucher."),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ voucherId, isActive }: { voucherId: string; isActive: boolean }) =>
      toggleAdminChatSubscriptionVoucherApi(voucherId, isActive),
    onSuccess: async () => {
      await refreshVoucherData()
      toast.success("Đã cập nhật trạng thái voucher.")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Không cập nhật được voucher."),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminChatSubscriptionVoucherApi,
    onSuccess: async () => {
      await refreshVoucherData()
      toast.success("Đã xóa voucher.")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Không xóa được voucher."),
  })

  const normalizedSearch = search.trim().toLowerCase()
  const filteredVouchers = vouchers
    .filter((voucher) => {
      const matchesFilter = filter === "all" || (filter === "active" ? voucher.isActive : !voucher.isActive)
      const matchesSearch = !normalizedSearch
        || voucher.code.toLowerCase().includes(normalizedSearch)
        || voucher.name.toLowerCase().includes(normalizedSearch)
      return matchesFilter && matchesSearch
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

  const pageCount = Math.max(1, Math.ceil(filteredVouchers.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleVouchers = filteredVouchers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeCount = vouchers.filter((voucher) => voucher.isActive).length
  const usedCount = vouchers.reduce((sum, voucher) => sum + voucher.usedCount, 0)
  const unlimitedCount = vouchers.filter((voucher) => !voucher.expiresAt).length

  const openCreate = () => {
    setForm(emptyVoucherForm)
    setEditingVoucherId(null)
    setIsModalOpen(true)
  }

  const openEdit = (voucher: ChatSubscriptionVoucherResponse) => {
    setForm(voucherToForm(voucher))
    setEditingVoucherId(voucher.voucherId)
    setIsModalOpen(true)
  }

  const handleDelete = (voucher: ChatSubscriptionVoucherResponse) => {
    if (window.confirm(`Xóa voucher ${voucher.code}? Voucher đã có giao dịch chỉ có thể tắt.`)) {
      deleteMutation.mutate(voucher.voucherId)
    }
  }

  const datetimeMin = localDatetimeNow()
  const startsAtMin = form.startsAt && form.startsAt < datetimeMin ? form.startsAt : datetimeMin
  const expiresAtMin = form.expiresAt && form.expiresAt < datetimeMin
    ? form.expiresAt
    : form.startsAt || datetimeMin

  return (
    <div className="grid gap-5 md:gap-6">
      <section className="flex flex-col gap-4 rounded-[26px] bg-[#14372f] p-5 text-white shadow-lg shadow-emerald-950/10 ring-1 ring-[#14372f] md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#ffad78] ring-1 ring-white/10">
            <TicketPercent className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-50/65">AI Premium</p>
            <h2 className="mt-1 text-2xl font-extrabold">Quản lý voucher</h2>
            <p className="mt-1 text-sm font-medium text-emerald-50/65">Tạo và kiểm soát mã ưu đãi độc lập với nghiệp vụ đăng ký.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-extrabold text-white transition hover:bg-po-primary-hover"
        >
          <Plus className="size-4" />
          Tạo voucher
        </button>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={TicketPercent} label="Tổng voucher" value={vouchers.length} />
        <Metric icon={Power} label="Đang bật" value={activeCount} />
        <Metric icon={BadgePercent} label="Lượt đã dùng" value={usedCount} />
        <Metric icon={CalendarClock} label="Không giới hạn" value={unlimitedCount} />
      </div>

      <section className="overflow-hidden rounded-[26px] bg-white shadow-sm shadow-orange-200/15 ring-1 ring-po-border/80">
        <div className="flex flex-col gap-3 border-b border-po-border/70 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Danh sách voucher</h3>
            <p className="mt-1 text-xs font-semibold text-po-text-muted">{filteredVouchers.length} mã phù hợp bộ lọc</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-2xl border border-po-border bg-po-surface-muted/30 px-3 sm:w-64">
              <Search className="size-4 shrink-0 text-po-text-subtle" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Tìm mã hoặc tên..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-po-text outline-none placeholder:text-po-text-subtle"
              />
            </label>
            <SelectMenu
              ariaLabel="Lọc trạng thái voucher"
              value={filter}
              options={voucherFilterOptions}
              onChange={(nextFilter) => {
                setFilter(nextFilter)
                setPage(1)
              }}
              className="sm:w-48"
              triggerClassName="rounded-2xl font-bold"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="size-7 animate-spin text-po-primary" /></div>
        ) : visibleVouchers.length ? (
          <>
            <div className="hidden grid-cols-[minmax(180px,1.3fr)_120px_120px_minmax(180px,1fr)_100px_120px] gap-4 bg-po-surface-muted/45 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-po-text-subtle lg:grid">
              <span>Voucher</span><span>Mức giảm</span><span>Lượt dùng</span><span>Thời gian</span><span>Trạng thái</span><span className="text-right">Thao tác</span>
            </div>
            <div>
              {visibleVouchers.map((voucher) => {
                const status = voucherStatus(voucher)
                const discount = voucher.discountType === "Percent" ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue)
                return (
                  <article key={voucher.voucherId} className="grid gap-3 border-b border-po-border/60 px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(180px,1.3fr)_120px_120px_minmax(180px,1fr)_100px_120px] lg:items-center lg:gap-4 lg:px-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-po-primary">{voucher.code}</p>
                        <span className="lg:hidden"><StatusBadge label={status.label} variant={status.variant} /></span>
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-po-text">{voucher.name}</p>
                      {voucher.description ? <p className="mt-1 truncate text-xs text-po-text-muted">{voucher.description}</p> : null}
                    </div>
                    <Info label="Mức giảm" value={discount} />
                    <Info label="Lượt dùng" value={`${voucher.usedCount}/${voucher.usageLimit ?? "∞"}`} />
                    <div className="text-xs font-semibold leading-5 text-po-text-muted">
                      <p><span className="lg:hidden">Bắt đầu: </span>{voucher.startsAt ? formatDate(voucher.startsAt) : "Có hiệu lực ngay"}</p>
                      <p><span className="lg:hidden">Kết thúc: </span>{formatDate(voucher.expiresAt)}</p>
                    </div>
                    <div className="hidden lg:block"><StatusBadge label={status.label} variant={status.variant} /></div>
                    <div className="flex items-center gap-2 lg:justify-end">
                      <IconButton label="Sửa voucher" onClick={() => openEdit(voucher)}><Edit3 className="size-4" /></IconButton>
                      <IconButton
                        label={voucher.isActive ? "Tắt voucher" : "Bật voucher"}
                        onClick={() => toggleMutation.mutate({ voucherId: voucher.voucherId, isActive: !voucher.isActive })}
                        disabled={toggleMutation.isPending}
                      >
                        <Power className="size-4" />
                      </IconButton>
                      <IconButton label="Xóa voucher" onClick={() => handleDelete(voucher)} disabled={deleteMutation.isPending} danger>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        ) : (
          <div className="grid place-items-center px-5 py-16 text-center">
            <TicketPercent className="size-7 text-po-primary" />
            <p className="mt-3 text-sm font-extrabold text-po-text">Không có voucher phù hợp</p>
            <p className="mt-1 text-xs font-semibold text-po-text-muted">Thử đổi từ khóa hoặc trạng thái lọc.</p>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="flex items-center justify-end gap-2 border-t border-po-border/70 px-4 py-4 md:px-5">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} className="h-9 rounded-full border border-po-border px-3 text-xs font-extrabold text-po-text-muted disabled:opacity-40">Trước</button>
            <span className="text-xs font-bold text-po-text-muted">{currentPage}/{pageCount}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage >= pageCount} className="h-9 rounded-full border border-po-border px-3 text-xs font-extrabold text-po-text-muted disabled:opacity-40">Sau</button>
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <VoucherModal
          form={form}
          setForm={setForm}
          editing={Boolean(editingVoucherId)}
          isSaving={saveMutation.isPending}
          startsAtMin={startsAtMin}
          expiresAtMin={expiresAtMin}
          onClose={closeModal}
          onSubmit={(event) => {
            event.preventDefault()
            saveMutation.mutate(buildVoucherRequest(form))
          }}
        />
      ) : null}
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof TicketPercent; label: string; value: number }) {
  return (
    <article className="flex items-center gap-3 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-po-border/80">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary"><Icon className="size-4.5" /></span>
      <div><p className="text-2xl font-extrabold text-po-text">{value}</p><p className="text-xs font-bold text-po-text-muted">{label}</p></div>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-po-text-subtle lg:hidden">{label}</p><p className="mt-1 text-sm font-extrabold text-po-text lg:mt-0">{value}</p></div>
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled} className={`grid size-9 place-items-center rounded-full border bg-white transition disabled:opacity-40 ${danger ? "border-po-border text-po-text-muted hover:border-red-200 hover:text-red-600" : "border-po-border text-po-text-muted hover:border-orange-200 hover:text-po-primary"}`}>
      {children}
    </button>
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
      <form onSubmit={onSubmit} className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl shadow-emerald-950/20 ring-1 ring-po-border">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-po-border bg-white/95 px-5 py-4 backdrop-blur md:px-6">
          <div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-po-primary">Voucher Premium</p><h3 className="mt-1 text-xl font-extrabold text-po-text">{editing ? "Sửa voucher" : "Tạo voucher mới"}</h3></div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full border border-po-border text-po-text-muted transition hover:text-po-text" title="Đóng"><X className="size-4" /></button>
        </div>

        <div className="grid gap-4 p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mã voucher"><input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))} maxLength={40} required placeholder="PETOMI20" className={inputClass} /></Field>
            <Field label="Tên"><input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} maxLength={120} required placeholder="Ưu đãi tháng này" className={inputClass} /></Field>
          </div>
          <Field label="Mô tả nội bộ"><input value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} maxLength={300} placeholder="Ghi chú cho admin" className={inputClass} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-po-text-subtle">Kiểu giảm</span>
              <SelectMenu
                ariaLabel="Kiểu giảm giá"
                value={form.discountType}
                options={discountTypeOptions}
                onChange={(discountType) => setForm((prev) => ({ ...prev, discountType }))}
                triggerClassName={inputClass}
              />
            </div>
            <Field label={form.discountType === "Percent" ? "Giảm (%)" : "Giảm (VND)"}><input type="number" min="1" max={form.discountType === "Percent" ? 90 : undefined} value={form.discountValue} onChange={(event) => setForm((prev) => ({ ...prev, discountValue: event.target.value }))} required className={inputClass} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Giảm tối đa"><input type="number" min="0" value={form.maxDiscountAmount} onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))} placeholder="Không giới hạn" className={inputClass} /></Field>
            <Field label="Đơn tối thiểu"><input type="number" min="0" value={form.minOrderAmount} onChange={(event) => setForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))} className={inputClass} /></Field>
            <Field label="Lượt dùng"><input type="number" min="1" value={form.usageLimit} onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))} placeholder="Không giới hạn" className={inputClass} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bắt đầu"><input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))} min={startsAtMin} className={inputClass} /></Field>
            <Field label="Hết hạn"><input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))} min={expiresAtMin} disabled={form.neverExpires} className={inputClass} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-2xl bg-po-surface-muted/45 px-3 py-3 text-sm font-bold text-po-text ring-1 ring-po-border/70"><input type="checkbox" checked={form.neverExpires} onChange={(event) => setForm((prev) => ({ ...prev, neverExpires: event.target.checked, expiresAt: event.target.checked ? "" : prev.expiresAt }))} className="size-4 accent-po-primary" />Không bao giờ hết hạn</label>
            <label className="flex items-center gap-2 rounded-2xl bg-po-surface-muted/45 px-3 py-3 text-sm font-bold text-po-text ring-1 ring-po-border/70"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} className="size-4 accent-po-primary" />Đang bật voucher</label>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-po-border bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end md:px-6">
          <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-full border border-po-border bg-white px-5 text-sm font-extrabold text-po-text-muted">Hủy</button>
          <button type="submit" disabled={isSaving} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-extrabold text-white transition hover:bg-po-primary-hover disabled:opacity-60">{isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{editing ? "Lưu voucher" : "Tạo voucher"}</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-extrabold uppercase tracking-[0.08em] text-po-text-subtle">{label}</span>{children}</label>
}
