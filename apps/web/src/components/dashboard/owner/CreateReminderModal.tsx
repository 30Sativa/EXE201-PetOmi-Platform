import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createReminderApi } from "@/services/reminders.service"
import { getPetsApi } from "@/services/pets.service"
import type { CreateReminderRequest } from "@/types"

const REMINDER_TYPES = [
  { value: "Vaccine", label: "Tiêm phòng" },
  { value: "Medication", label: "Thuốc" },
  { value: "FollowUp", label: "Tái khám" },
  { value: "Deworming", label: "Tẩy giun" },
  { value: "Grooming", label: "Vệ sinh" },
  { value: "WeightTracking", label: "Cân nặng" },
  { value: "Custom", label: "Tùy chỉnh" },
]

const REPEAT_OPTIONS = [
  { value: "", label: "Không lặp" },
  { value: "daily", label: "Hàng ngày" },
  { value: "weekly", label: "Hàng tuần" },
  { value: "monthly", label: "Hàng tháng" },
]

interface CreateReminderModalProps {
  isOpen: boolean
  onClose: () => void
  defaultPetId?: string
}

export default function CreateReminderModal({
  isOpen,
  onClose,
  defaultPetId,
}: CreateReminderModalProps) {
  const queryClient = useQueryClient()

  const [reminderType, setReminderType] = useState("Vaccine")
  const [petId, setPetId] = useState(defaultPetId ?? "")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [remindAtDate, setRemindAtDate] = useState("")
  const [remindAtTime, setRemindAtTime] = useState("09:00")
  const [repeatRule, setRepeatRule] = useState("")
  const [repeatUntil, setRepeatUntil] = useState("")

  useEffect(() => {
    if (isOpen) {
      setReminderType("Vaccine")
      setPetId(defaultPetId ?? "")
      setTitle("")
      setMessage("")
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setRemindAtDate(tomorrow.toISOString().split("T")[0])
      setRemindAtTime("09:00")
      setRepeatRule("")
      setRepeatUntil("")
    }
  }, [isOpen, defaultPetId])

  const { data: pets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
    enabled: isOpen,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateReminderRequest) => createReminderApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-reminders"] })
      toast.success("Tạo nhắc nhở thành công!")
      onClose()
    },
    onError: () => {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
    },
  })

  const isLoading = createMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!remindAtDate) return

    const remindAt = new Date(`${remindAtDate}T${remindAtTime}:00`).toISOString()

    if (new Date(remindAt) <= new Date()) {
      toast.error("Thời điểm nhắc phải lớn hơn thời gian hiện tại.")
      return
    }

    const payload: CreateReminderRequest = {
      reminderType,
      petId: petId || undefined,
      title: title.trim(),
      message: message.trim() || undefined,
      remindAt,
      sourceType: "Owner",
      repeatRule: repeatRule
        ? JSON.stringify({ type: repeatRule })
        : undefined,
      repeatUntil: repeatUntil
        ? new Date(repeatUntil).toISOString()
        : undefined,
    }

    createMutation.mutate(payload)
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
      <div className="m-auto w-[min(560px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Tạo nhắc nhở</h3>
            <p className="mt-1 text-sm text-po-text-muted">
              Đặt lịch nhắc nhở cho thú cưng của bạn.
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
          {/* Reminder Type */}
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">
              Loại nhắc nhở <span className="text-po-danger">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setReminderType(t.value)}
                  disabled={isLoading}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    reminderType === t.value
                      ? "border-po-primary bg-po-primary/10 text-po-primary"
                      : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong"
                  } ${isLoading ? "opacity-60" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pet Selection */}
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">Thú cưng</label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm text-po-text focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            >
              <option value="">-- Chọn thú cưng (tùy chọn) --</option>
              {(pets ?? []).map((pet) => (
                <option key={pet.petId} value={pet.petId}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">
              Tiêu đề <span className="text-po-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tiêm phòng dại lần 2 cho Bé"
              required
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>

          {/* Date & Time */}
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-po-text">
                Ngày nhắc <span className="text-po-danger">*</span>
              </label>
              <input
                type="date"
                value={remindAtDate}
                onChange={(e) => setRemindAtDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-po-text">
                Giờ nhắc <span className="text-po-danger">*</span>
              </label>
              <input
                type="time"
                value={remindAtTime}
                onChange={(e) => setRemindAtTime(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Repeat */}
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-po-text">Lặp lại</label>
              <select
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value)}
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm text-po-text focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              >
                {REPEAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {repeatRule && (
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-po-text">
                  Kết thúc lặp
                </label>
                <input
                  type="date"
                  value={repeatUntil}
                  onChange={(e) => setRepeatUntil(e.target.value)}
                  min={remindAtDate}
                  disabled={isLoading}
                  className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
                />
              </div>
            )}
          </div>

          {/* Message */}
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">Nội dung nhắc</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nội dung nhắc nhở chi tiết (tùy chọn)..."
              rows={3}
              disabled={isLoading}
              className="w-full resize-none rounded-xl border border-po-border bg-white px-4 py-2.5 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>

          {/* Actions */}
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
              disabled={isLoading || !title.trim() || !remindAtDate}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              {isLoading ? "Đang xử lý..." : "Tạo nhắc nhở"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
