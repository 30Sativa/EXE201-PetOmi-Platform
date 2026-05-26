import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createPetHealthProfileApi,
  updatePetHealthProfileApi,
} from "@/services/pets.service"
import type {
  CreatePetHealthProfileRequest,
  PetHealthProfileResponse,
  UpdatePetHealthProfileRequest,
} from "@/types"

interface HealthProfileModalProps {
  isOpen: boolean
  onClose: () => void
  petId: string
  existingProfile?: PetHealthProfileResponse | null
  initialWeightKg?: number | null
  initialColor?: string | null
  initialIsNeutered?: string | null
}

export default function HealthProfileModal({
  isOpen,
  onClose,
  petId,
  existingProfile,
  initialWeightKg,
  initialColor,
  initialIsNeutered,
}: HealthProfileModalProps) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(existingProfile)

  const [weightKg, setWeightKg] = useState("")
  const [color, setColor] = useState("")
  const [isNeutered, setIsNeutered] = useState("")
  const [allergies, setAllergies] = useState("")
  const [chronicConditions, setChronicConditions] = useState("")
  const [microchip, setMicrochip] = useState("")

  useEffect(() => {
    if (existingProfile) {
      setWeightKg(existingProfile.currentWeightKg?.toString() ?? "")
      setColor(existingProfile.color ?? "")
      setIsNeutered(existingProfile.isNeutered ?? "")
      setAllergies(existingProfile.allergies ?? "")
      setChronicConditions(existingProfile.chronicConditions ?? "")
      setMicrochip(existingProfile.microchipNumber ?? "")
    } else if (isOpen) {
      setWeightKg(initialWeightKg ? String(initialWeightKg) : "")
      setColor(initialColor ?? "")
      setIsNeutered(initialIsNeutered ?? "")
      setAllergies("")
      setChronicConditions("")
      setMicrochip("")
    }
  }, [existingProfile, isOpen, initialWeightKg, initialColor, initialIsNeutered])

  const createMutation = useMutation({
    mutationFn: (data: CreatePetHealthProfileRequest) =>
      createPetHealthProfileApi(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-health", petId] })
      toast.success(isEdit ? "Cập nhật hồ sơ sức khỏe thành công!" : "Tạo hồ sơ sức khỏe thành công!")
      onClose()
    },
    onError: () => {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePetHealthProfileRequest) =>
      updatePetHealthProfileApi(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-health", petId] })
      toast.success("Cập nhật hồ sơ sức khỏe thành công!")
      onClose()
    },
    onError: () => {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
      onClose()
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      updateMutation.mutate({
        currentWeightKg: weightKg ? Number(weightKg) : null,
        color: color || null,
        isNeutered: isNeutered || null,
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
        microchipNumber: microchip || null,
      })
    } else {
      createMutation.mutate({
        currentWeightKg: weightKg ? Number(weightKg) : undefined,
        color: color || undefined,
        isNeutered: isNeutered || undefined,
        allergies: allergies || undefined,
        chronicConditions: chronicConditions || undefined,
        microchipNumber: microchip || undefined,
      })
    }
  }

  const handleClose = () => {
    if (isLoading) return
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
      <div className="m-auto w-[min(540px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">
              {isEdit ? "Cập nhật hồ sơ sức khỏe" : "Tạo hồ sơ sức khỏe"}
            </h3>
            <p className="mt-1 text-sm text-po-text-muted">
              {isEdit
                ? "Cập nhật thông tin sức khỏe cho thú cưng."
                : "Nhập thông tin sức khỏe để tạo hồ sơ."}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">Cân nặng (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="VD: 5.2"
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">Màu lông</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="VD: Vàng cỏ"
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Triệt sản</label>
          <div className="flex gap-2">
            {[
              { value: "Yes", label: "Đã triệt sản" },
              { value: "No", label: "Chưa triệt sản" },
              { value: "Unknown", label: "Không rõ" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIsNeutered(opt.value)}
                disabled={isLoading}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isNeutered === opt.value
                    ? "border-po-primary bg-po-primary/10 text-po-primary"
                    : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong"
                } ${isLoading ? "opacity-60" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Dị ứng</label>
          <textarea
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="VD: Thức ăn hạt, thuốc xịt..."
            rows={2}
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-po-border bg-white px-4 py-2.5 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Bệnh mãn tính</label>
          <textarea
            value={chronicConditions}
            onChange={(e) => setChronicConditions(e.target.value)}
            placeholder="VD: Viêm da, tiểu đường..."
            rows={2}
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-po-border bg-white px-4 py-2.5 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Số microchip</label>
          <input
            type="text"
            value={microchip}
            onChange={(e) => setMicrochip(e.target.value)}
            placeholder="VD: 123456789012345"
            disabled={isLoading}
            className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-11 items-center rounded-full border border-po-border bg-white px-6 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            {isLoading ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Tạo hồ sơ"}
          </button>
        </div>
      </form>
      </div>
      </div>
  )
}
