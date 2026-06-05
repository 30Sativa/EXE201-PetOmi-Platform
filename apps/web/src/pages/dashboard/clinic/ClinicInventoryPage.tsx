import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  Boxes,
  CalendarClock,
  ImageIcon,
  PackagePlus,
  PackageSearch,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import EmptyState from "@/components/ui/EmptyState"
import ImageUploadField from "@/components/ui/ImageUploadField"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { formatCurrency, formatDate } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import {
  addInventoryItemApi,
  deleteInventoryItemApi,
  getInventoryApi,
  stockInApi,
  stockOutApi,
} from "@/services/clinic.service"
import type { InventoryItemResponse } from "@/types"

type Filter = "all" | "low" | "expired" | "inactive"
type StockAction = { item: InventoryItemResponse; type: "in" | "out" } | null

const emptyForm = {
  itemName: "",
  unit: "",
  quantity: "0",
  lowStockThreshold: "10",
  unitPrice: "",
  expiryDate: "",
  imageUrl: "",
  imageCloudinaryPublicId: "",
}

const compactNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value)

const formatCompactCurrency = (value?: number | null) => {
  const amount = value ?? 0
  const absolute = Math.abs(amount)

  if (absolute >= 1_000_000_000) return `${compactNumber(amount / 1_000_000_000)} tỷ`
  if (absolute >= 1_000_000) return `${compactNumber(amount / 1_000_000)} triệu`
  if (absolute >= 100_000) return `${compactNumber(amount / 1_000)} nghìn`

  return formatCurrency(amount)
}

export default function ClinicInventoryPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [filter, setFilter] = useState<Filter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [stockAction, setStockAction] = useState<StockAction>(null)
  const [stockAmount, setStockAmount] = useState("1")
  const [stockNote, setStockNote] = useState("")

  const inventoryQuery = useQuery({
    queryKey: ["clinic", clinicId, "inventory"],
    queryFn: () => getInventoryApi(clinicId),
    enabled: Boolean(clinicId),
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "inventory"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "low-stock"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "dashboard-summary"] }),
    ])
  }

  const addMutation = useMutation({
    mutationFn: () =>
      addInventoryItemApi(clinicId, {
        itemName: form.itemName.trim(),
        unit: form.unit.trim() || null,
        quantity: Number(form.quantity) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 10,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        expiryDate: form.expiryDate || null,
        imageUrl: form.imageUrl || null,
        imageCloudinaryPublicId: form.imageCloudinaryPublicId || null,
      }),
    onSuccess: async () => {
      toast.success("Đã thêm mặt hàng.")
      setForm(emptyForm)
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể thêm mặt hàng.")),
  })

  const stockMutation = useMutation({
    mutationFn: () => {
      if (!stockAction) return Promise.reject(new Error("Chưa chọn mặt hàng."))
      const data = {
        amount: Number(stockAmount) || 0,
        note: stockNote.trim() || null,
      }

      return stockAction.type === "in"
        ? stockInApi(clinicId, stockAction.item.itemId, data)
        : stockOutApi(clinicId, stockAction.item.itemId, data)
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật tồn kho.")
      setStockAction(null)
      setStockAmount("1")
      setStockNote("")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể cập nhật tồn kho.")),
  })

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteInventoryItemApi(clinicId, itemId),
    onSuccess: async () => {
      toast.success("Đã xóa mặt hàng.")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể xóa mặt hàng.")),
  })

  const items = useMemo(() => inventoryQuery.data ?? [], [inventoryQuery.data])
  const inventoryStats = useMemo(() => {
    const lowStock = items.filter((item) => item.isLowStock).length
    const expired = items.filter((item) => item.isExpired).length
    const inactive = items.filter((item) => !item.isActive).length
    const totalValue = items.reduce((sum, item) => sum + item.quantity * (item.unitPrice ?? 0), 0)

    return { lowStock, expired, inactive, totalValue }
  }, [items])

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return items.filter((item) => {
      const matchesFilter =
        filter === "low"
          ? item.isLowStock
          : filter === "expired"
            ? item.isExpired
            : filter === "inactive"
              ? !item.isActive
              : true

      const matchesSearch =
        !keyword ||
        item.itemName.toLowerCase().includes(keyword) ||
        (item.unit ?? "").toLowerCase().includes(keyword)

      return matchesFilter && matchesSearch
    })
  }, [filter, items, searchTerm])

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={PackageSearch} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi quản lý kho." />
  }

  const canAdd = form.itemName.trim() && Number(form.quantity) >= 0 && Number(form.lowStockThreshold) >= 0
  const isAdding = addMutation.isPending || isImageUploading

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[26px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              Kho clinic
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight text-po-text">
              Thuốc, vật tư và hàng bán tại quầy
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-po-text-muted">
              Ưu tiên cảnh báo tồn kho và hạn dùng trước, form nhập mới nằm riêng để danh sách không bị đẩy xuống quá xa.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[390px]">
            <MetricCard label="Tổng giá trị" value={formatCompactCurrency(inventoryStats.totalValue)} fullValue={formatCurrency(inventoryStats.totalValue)} icon={Archive} tone="info" />
            <MetricCard label="Cần chú ý" value={`${inventoryStats.lowStock + inventoryStats.expired}`} hint={`${inventoryStats.lowStock} sắp hết`} icon={AlertTriangle} tone="warning" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:h-[calc(100dvh-206px)] xl:min-h-[620px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-h-0 overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
          <div className="grid gap-3 border-b border-po-border/80 px-4 py-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-[180px]">
              <h3 className="text-base font-extrabold text-po-text">Danh sách kho</h3>
              <p className="mt-1 text-xs text-po-text-muted">{filtered.length} / {items.length} mặt hàng đang hiển thị.</p>
              </div>
              <p className="rounded-full bg-po-surface-muted px-3 py-1 text-xs font-bold text-po-text-muted">
                {inventoryStats.lowStock + inventoryStats.expired} cần kiểm tra
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
              <SearchBox value={searchTerm} onChange={setSearchTerm} />
              <TabFilter
                tabs={[
                  { value: "all", label: "Tất cả" },
                  { value: "low", label: "Sắp hết" },
                  { value: "expired", label: "Hết hạn" },
                  { value: "inactive", label: "Tạm ẩn" },
                ]}
                activeTab={filter}
                onChange={setFilter}
              />
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-4">
            {inventoryQuery.isLoading ? (
              <InventorySkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState icon={PackageSearch} title="Không có mặt hàng" description="Thử đổi bộ lọc hoặc thêm mặt hàng mới." className="py-14" />
            ) : (
              <div className="grid gap-3">
                {filtered.map((item) => (
                  <InventoryRow
                    key={item.itemId}
                    item={item}
                    onStockIn={() => setStockAction({ item, type: "in" })}
                    onStockOut={() => setStockAction({ item, type: "out" })}
                    onDelete={() => deleteMutation.mutate(item.itemId)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
          <section className="rounded-[26px] bg-white/90 p-4 ring-1 ring-po-border/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-po-text">Thêm mặt hàng</h3>
                <p className="mt-1 text-xs text-po-text-muted">Dùng cho toa thuốc và hóa đơn bán lẻ.</p>
              </div>
              <span className="grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                <PackagePlus className="size-5" />
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <Input label="Tên mặt hàng" value={form.itemName} onChange={(value) => setForm({ ...form, itemName: value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Đơn vị" value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
                <Input label="Tồn đầu" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ngưỡng cảnh báo" value={form.lowStockThreshold} onChange={(value) => setForm({ ...form, lowStockThreshold: value })} />
                <Input label="Đơn giá" value={form.unitPrice} onChange={(value) => setForm({ ...form, unitPrice: value })} />
              </div>
              <Input label="Hạn dùng" type="date" value={form.expiryDate} onChange={(value) => setForm({ ...form, expiryDate: value })} />

              <ImageUploadField
                label="Ảnh sản phẩm"
                value={form.imageUrl}
                onChange={(url) =>
                  setForm((current) => ({
                    ...current,
                    imageUrl: url,
                    imageCloudinaryPublicId: url ? current.imageCloudinaryPublicId : "",
                  }))}
                onUploadComplete={(result) => setForm((current) => ({ ...current, imageCloudinaryPublicId: result.publicId }))}
                imageType="inventory_item"
                resourceId={clinicId}
                previewClassName="h-20 w-20 rounded-2xl border border-po-border object-cover"
                maxSizeMb={5}
                disabled={isAdding}
                onUploadStateChange={setIsImageUploading}
              />
            </div>

            <button
              onClick={() => addMutation.mutate()}
              disabled={!canAdd || isAdding}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:opacity-60 active:translate-y-0"
            >
              <Plus className="size-4" />
              {addMutation.isPending ? "Đang thêm..." : "Thêm mặt hàng"}
            </button>
          </section>

          <section className="min-h-0 overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
            <div className="border-b border-po-border/80 px-4 py-3">
              <h3 className="text-base font-extrabold text-po-text">Cảnh báo nhanh</h3>
              <p className="mt-1 text-xs text-po-text-muted">Các nhóm cần kiểm tra trước khi bán hoặc kê toa.</p>
            </div>
            <div className="grid gap-2 overflow-y-auto p-4">
              <AlertRow icon={TrendingDown} label="Sắp hết hàng" value={inventoryStats.lowStock} tone="warning" />
              <AlertRow icon={CalendarClock} label="Hết hạn dùng" value={inventoryStats.expired} tone="danger" />
              <AlertRow icon={Boxes} label="Tạm ẩn" value={inventoryStats.inactive} tone="neutral" />
            </div>
          </section>
        </aside>
      </div>

      {stockAction ? (
        <StockModal
          stockAction={stockAction}
          stockAmount={stockAmount}
          stockNote={stockNote}
          isSaving={stockMutation.isPending}
          onAmountChange={setStockAmount}
          onNoteChange={setStockNote}
          onClose={() => setStockAction(null)}
          onConfirm={() => stockMutation.mutate()}
        />
      ) : null}
    </div>
  )
}

function SearchBox({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative block w-full sm:w-56">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm mặt hàng"
        className="h-10 w-full rounded-full border border-po-border bg-white pl-9 pr-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}

function MetricCard({
  label,
  value,
  fullValue,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  fullValue?: string
  hint?: string
  icon: LucideIcon
  tone: "info" | "warning"
}) {
  const toneClass = {
    info: "bg-po-primary-soft text-po-primary",
    warning: "bg-po-warning-soft text-po-warning",
  }[tone]

  return (
    <div className="grid min-h-[82px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[22px] bg-po-surface-muted/60 p-3 ring-1 ring-po-border/70">
      <span className={`grid size-9 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-po-text-muted">{label}</p>
        <p className="mt-1 truncate text-lg font-extrabold leading-none text-po-text" title={fullValue ?? value}>{value}</p>
        {hint ? <p className="mt-1.5 text-xs font-semibold text-po-text-subtle">{hint}</p> : null}
      </div>
    </div>
  )
}

function InventoryRow({
  item,
  onStockIn,
  onStockOut,
  onDelete,
  isDeleting,
}: {
  item: InventoryItemResponse
  onStockIn: () => void
  onStockOut: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const stockPercent = Math.min(100, Math.round((item.quantity / Math.max(1, item.lowStockThreshold)) * 100))
  const stockTone = item.isExpired ? "bg-po-danger" : item.isLowStock ? "bg-po-warning" : "bg-po-success"

  return (
    <article className="grid gap-4 rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70 transition hover:bg-white hover:shadow-sm hover:shadow-orange-100/70 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.8fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.itemName} className="size-14 rounded-2xl border border-po-border object-cover" />
        ) : (
          <span className="grid size-14 place-items-center rounded-2xl bg-white text-po-text-subtle ring-1 ring-po-border/70">
            <ImageIcon className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-extrabold text-po-text">{item.itemName}</h4>
            {!item.isActive ? <StatusBadge variant="default" label="Tạm ẩn" /> : null}
          </div>
          <p className="mt-1 text-xs font-medium text-po-text-muted">
            {item.unit ?? "Không có đơn vị"} · <span title={formatCurrency(item.unitPrice)}>{formatCompactCurrency(item.unitPrice)}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-po-text-muted">Tồn kho</p>
          <p className="text-sm font-extrabold text-po-text">
            {item.quantity} <span className="text-xs font-semibold text-po-text-subtle">/ {item.lowStockThreshold}</span>
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-po-border/60">
          <div className={`h-full rounded-full ${stockTone}`} style={{ width: `${stockPercent}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.isLowStock ? <StatusBadge variant="warning" label="Sắp hết" /> : null}
          {item.isExpired ? <StatusBadge variant="danger" label="Hết hạn" /> : null}
          {!item.isLowStock && !item.isExpired ? <StatusBadge variant="success" label="Ổn" /> : null}
          <span className="text-xs font-semibold text-po-text-subtle">HSD {formatDate(item.expiryDate)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button onClick={onStockIn} className="inline-flex h-9 items-center rounded-full bg-po-success-soft px-4 text-xs font-bold text-po-success transition hover:bg-po-success hover:text-white active:translate-y-px">
          Nhập
        </button>
        <button onClick={onStockOut} className="inline-flex h-9 items-center rounded-full bg-po-warning-soft px-4 text-xs font-bold text-po-warning transition hover:bg-po-warning hover:text-white active:translate-y-px">
          Xuất
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="inline-flex size-9 items-center justify-center rounded-full bg-po-danger-soft text-po-danger transition hover:bg-po-danger hover:text-white disabled:opacity-60 active:translate-y-px"
          aria-label={`Xóa ${item.itemName}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  )
}

function AlertRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: number
  tone: "warning" | "danger" | "neutral"
}) {
  const toneClass = {
    warning: "bg-po-warning-soft text-po-warning",
    danger: "bg-po-danger-soft text-po-danger",
    neutral: "bg-po-surface-muted text-po-text-muted",
  }[tone]

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-po-surface-muted/55 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span className={`grid size-8 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="size-4" />
        </span>
        <p className="text-xs font-bold text-po-text">{label}</p>
      </div>
      <span className="font-mono text-sm font-extrabold text-po-text">{value}</span>
    </div>
  )
}

function InventorySkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid gap-4 rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.8fr)_auto] lg:items-center">
          <div className="flex items-center gap-3">
            <div className="size-14 animate-pulse rounded-2xl bg-white" />
            <div className="grid flex-1 gap-2">
              <div className="h-4 w-40 animate-pulse rounded-full bg-white" />
              <div className="h-3 w-28 animate-pulse rounded-full bg-white" />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white" />
            <div className="h-2 animate-pulse rounded-full bg-white" />
          </div>
          <div className="h-9 w-36 animate-pulse rounded-full bg-white lg:justify-self-end" />
        </div>
      ))}
    </div>
  )
}

function StockModal({
  stockAction,
  stockAmount,
  stockNote,
  isSaving,
  onAmountChange,
  onNoteChange,
  onClose,
  onConfirm,
}: {
  stockAction: Exclude<StockAction, null>
  stockAmount: string
  stockNote: string
  isSaving: boolean
  onAmountChange: (value: string) => void
  onNoteChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="m-auto w-[min(440px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        <h3 className="text-lg font-extrabold text-po-text">{stockAction.type === "in" ? "Nhập kho" : "Xuất kho"}</h3>
        <p className="mt-1 text-sm text-po-text-muted">{stockAction.item.itemName}</p>
        <div className="mt-5 grid gap-4">
          <Input label="Số lượng" value={stockAmount} onChange={onAmountChange} />
          <label className="grid gap-1.5 text-xs font-bold text-po-text">
            Ghi chú
            <textarea
              value={stockNote}
              onChange={(event) => onNoteChange(event.target.value)}
              rows={3}
              className="resize-none rounded-2xl border border-po-border bg-white px-3 py-3 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={!Number(stockAmount) || isSaving}
            className="inline-flex h-10 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  suffix,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  suffix?: ReactNode
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-po-text">
      {label}
      <span className="relative">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-10 w-full rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20 ${suffix ? "pr-10" : ""}`}
        />
        {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-po-text-subtle">{suffix}</span> : null}
      </span>
    </label>
  )
}
