import { X } from "lucide-react"
import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createPetWeightLogApi } from "@/services/pets.service"
import type { CreatePetWeightLogRequest } from "@/types"

interface WeightLogModalProps {
  isOpen: boolean
  onClose: () => void
  petId: string
  initialWeightKg?: number | null
}

export default function WeightLogModal({
  isOpen,
  onClose,
  petId,
  initialWeightKg,
}: WeightLogModalProps) {
  const queryClient = useQueryClient()

  const [weightKg, setWeightKg] = useState("")
  const [measuredAt, setMeasuredAt] = useState(
    new Date().toISOString().slice(0, 16),
  )
  const [source, setSource] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (isOpen) {
      setWeightKg(initialWeightKg ? String(initialWeightKg) : "")
      setMeasuredAt(new Date().toISOString().slice(0, 16))
      setSource("")
      setNote("")
    }
  }, [isOpen, initialWeightKg])

  const mutation = useMutation({
    mutationFn: (data: CreatePetWeightLogRequest) =>
      createPetWeightLogApi(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-weight", petId] })
      toast.success("Ghi nhận cân nặng thành công!")
      onClose()
    },
    onError: () => {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const weight = Number(weightKg)
    if (!weight || weight <= 0) return

    mutation.mutate({
      weightKg: weight,
      measuredAt: new Date(measuredAt).toISOString(),
      source: source || undefined,
      note: note || undefined,
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={handleBackdropClick}
    >
      <div className="m-auto w-[min(480px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Ghi nhận cân nặng</h3>
            <p className="mt-1 text-sm text-po-text-muted">
              Nhập cân nặng hiện tại của thú cưng để theo dõi.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={mutation.isPending}
            className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">
            Cân nặng (kg) <span className="text-po-danger">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="VD: 5.2"
              required
              disabled={mutation.isPending}
              className="h-12 w-full rounded-xl border border-po-border bg-white px-4 pr-14 text-lg font-bold focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-po-text-muted">
              kg
            </span>
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Ngày giờ đo</label>
          <input
            type="datetime-local"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            max={new Date().toISOString().slice(0, 16)}
            disabled={mutation.isPending}
            className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Nguồn</label>
          <div className="flex flex-wrap gap-2">
            {["Nhà", "Phòng khám", "Pet Shop"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(source === s ? "" : s)}
                disabled={mutation.isPending}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  source === s
                    ? "border-po-primary bg-po-primary/10 text-po-primary"
                    : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong"
                } ${mutation.isPending ? "opacity-60" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Ghi chú</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Sau bữa ăn, buổi sáng..."
            rows={2}
            disabled={mutation.isPending}
            className="w-full resize-none rounded-xl border border-po-border bg-white px-4 py-2.5 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="inline-flex h-11 items-center rounded-full border border-po-border bg-white px-6 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !weightKg}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            {mutation.isPending ? "Đang xử lý..." : "Ghi nhận"}
          </button>
        </div>
      </form>
      </div>
      </div>
  )
}
