import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PackageSearch, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
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

type Filter = "all" | "low" | "expired"
type StockAction = { item: InventoryItemResponse; type: "in" | "out" } | null

const emptyForm = {
  itemName: "",
  unit: "",
  quantity: "0",
  lowStockThreshold: "10",
  unitPrice: "",
  expiryDate: "",
}

export default function ClinicInventoryPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [filter, setFilter] = useState<Filter>("all")
  const [form, setForm] = useState(emptyForm)
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
  const filtered = useMemo(() => {
    switch (filter) {
      case "low":
        return items.filter((item) => item.isLowStock)
      case "expired":
        return items.filter((item) => item.isExpired)
      default:
        return items
    }
  }, [filter, items])

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={PackageSearch} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi quản lý kho." />
  }

  const canAdd = form.itemName.trim() && Number(form.quantity) >= 0 && Number(form.lowStockThreshold) >= 0

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-po-text">Kho thuốc và vật tư</h2>
        <p className="mt-1 text-sm text-po-text-muted">Theo dõi tồn kho, ngưỡng cảnh báo và hạn dùng.</p>
      </div>

      <DashboardSection title="Thêm mặt hàng" subtitle="Mặt hàng có thể được link vào toa thuốc và auto-compose hóa đơn.">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Tên mặt hàng" value={form.itemName} onChange={(value) => setForm({ ...form, itemName: value })} />
          <Input label="Đơn vị" value={form.unit} onChange={(value) => setForm({ ...form, unit: value })} />
          <Input label="Tồn kho ban đầu" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
          <Input label="Ngưỡng cảnh báo" value={form.lowStockThreshold} onChange={(value) => setForm({ ...form, lowStockThreshold: value })} />
          <Input label="Đơn giá" value={form.unitPrice} onChange={(value) => setForm({ ...form, unitPrice: value })} />
          <Input label="Hạn dùng" type="date" value={form.expiryDate} onChange={(value) => setForm({ ...form, expiryDate: value })} />
        </div>
        <button
          onClick={() => addMutation.mutate()}
          disabled={!canAdd || addMutation.isPending}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
        >
          <Plus className="size-4" />
          {addMutation.isPending ? "Đang thêm..." : "Thêm mặt hàng"}
        </button>
      </DashboardSection>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabFilter
          tabs={[
            { value: "all", label: "Tất cả" },
            { value: "low", label: "Sắp hết" },
            { value: "expired", label: "Hết hạn" },
          ]}
          activeTab={filter}
          onChange={setFilter}
        />
        <p className="text-sm font-semibold text-po-text-muted">{filtered.length} mặt hàng</p>
      </div>

      <DashboardSection title="Danh sách kho" subtitle="Nhập/xuất kho đều cần ghi chú khi cần đối soát nội bộ.">
        {inventoryQuery.isLoading ? (
          <div className="py-12 text-center"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={PackageSearch} title="Không có mặt hàng" description="Thử đổi bộ lọc hoặc thêm mặt hàng mới." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-po-border text-xs uppercase tracking-[0.14em] text-po-text-subtle">
                  <th className="px-4 py-3">Mặt hàng</th>
                  <th className="px-4 py-3">Tồn kho</th>
                  <th className="px-4 py-3">Đơn giá</th>
                  <th className="px-4 py-3">Hạn dùng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-po-border/70">
                {filtered.map((item) => (
                  <tr key={item.itemId} className="hover:bg-po-surface-muted/50">
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-po-text">{item.itemName}</p>
                      <p className="text-xs text-po-text-muted">{item.unit ?? "Không có đơn vị"}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-po-text">{item.quantity} / {item.lowStockThreshold}</td>
                    <td className="px-4 py-4 text-sm text-po-text-muted">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-4 text-sm text-po-text-muted">{formatDate(item.expiryDate)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {item.isLowStock ? <StatusBadge variant="warning" label="Sắp hết" /> : null}
                        {item.isExpired ? <StatusBadge variant="danger" label="Hết hạn" /> : null}
                        {!item.isLowStock && !item.isExpired ? <StatusBadge variant="success" label="Ổn" /> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setStockAction({ item, type: "in" })} className="rounded-full bg-po-success-soft px-3 py-1.5 text-xs font-semibold text-po-success">Nhập</button>
                        <button onClick={() => setStockAction({ item, type: "out" })} className="rounded-full bg-po-warning-soft px-3 py-1.5 text-xs font-semibold text-po-warning">Xuất</button>
                        <button onClick={() => deleteMutation.mutate(item.itemId)} className="rounded-full bg-po-danger-soft px-3 py-1.5 text-xs font-semibold text-po-danger">
                          <Trash2 className="inline size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      {stockAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in" onClick={(event) => event.target === event.currentTarget && setStockAction(null)}>
          <div className="m-auto w-[min(440px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
            <h3 className="text-lg font-extrabold text-po-text">{stockAction.type === "in" ? "Nhập kho" : "Xuất kho"}</h3>
            <p className="mt-1 text-sm text-po-text-muted">{stockAction.item.itemName}</p>
            <div className="mt-5 grid gap-4">
              <Input label="Số lượng" value={stockAmount} onChange={setStockAmount} />
              <label className="grid gap-1.5 text-sm font-semibold text-po-text">
                Ghi chú
                <textarea
                  value={stockNote}
                  onChange={(event) => setStockNote(event.target.value)}
                  rows={3}
                  className="resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setStockAction(null)} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">Hủy</button>
              <button
                onClick={() => stockMutation.mutate()}
                disabled={!Number(stockAmount) || stockMutation.isPending}
                className="inline-flex h-10 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
              >
                {stockMutation.isPending ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}
