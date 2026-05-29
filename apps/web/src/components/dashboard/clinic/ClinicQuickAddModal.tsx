import { useEffect, useState } from "react"
import { AlertTriangle, CalendarCheck, Clock, Plus, Stethoscope, X } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/utils"
import {
  createEmergencyAppointmentApi,
  createWalkInAppointmentApi,
} from "@/services/clinic-appointments.service"
import { getPetsApi } from "@/services/pets.service"
import type { PetResponse } from "@/types"

const APPOINTMENT_TYPES = [
  { value: "Checkup", label: "Khám tổng quát" },
  { value: "Vaccination", label: "Tiêm phòng" },
  { value: "Surgery", label: "Phẫu thuật" },
  { value: "Grooming", label: "Làm đẹp" },
  { value: "Followup", label: "Tái khám" },
]

interface ClinicQuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  type: "walk-in" | "emergency"
  clinicId: string
}

export default function ClinicQuickAddModal({
  isOpen,
  onClose,
  type,
  clinicId,
}: ClinicQuickAddModalProps) {
  const queryClient = useQueryClient()

  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null)
  const [appointmentType, setAppointmentType] = useState("Checkup")
  const [notes, setNotes] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!isOpen) {
      queueMicrotask(() => {
        setSelectedPet(null)
        setAppointmentType("Checkup")
        setNotes("")
        setErrorMessage("")
      })
    }
  }, [isOpen])

  const { data: pets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
    enabled: isOpen,
  })

  const walkInMutation = useMutation({
    mutationFn: () => {
      if (!selectedPet || !clinicId) return Promise.reject(new Error("Thiếu thông tin."))
      const now = new Date()
      const dateStr = now.toISOString().split("T")[0]
      const startTime = now.toTimeString().slice(0, 5)
      const endTime = new Date(now.getTime() + 30 * 60 * 1000).toTimeString().slice(0, 5)
      return createWalkInAppointmentApi({
        clinicId,
        petId: selectedPet.petId,
        appointmentDate: dateStr,
        startTime,
        endTime,
        appointmentType,
        notes: notes.trim() || undefined,
      })
    },
    onSuccess: () => {
      toast.success("Đã tạo lịch hẹn walk-in.")
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] })
      onClose()
    },
    onError: (e) => {
      const msg = getErrorMessage(e, "Tạo lịch hẹn thất bại.")
      setErrorMessage(msg)
      toast.error(msg)
    },
  })

  const emergencyMutation = useMutation({
    mutationFn: () => {
      if (!selectedPet || !clinicId) return Promise.reject(new Error("Thiếu thông tin."))
      const now = new Date()
      const dateStr = now.toISOString().split("T")[0]
      const startTime = now.toTimeString().slice(0, 5)
      const endTime = new Date(now.getTime() + 30 * 60 * 1000).toTimeString().slice(0, 5)
      return createEmergencyAppointmentApi({
        clinicId,
        petId: selectedPet.petId,
        appointmentDate: dateStr,
        startTime,
        endTime,
        notes: notes.trim() || undefined,
      })
    },
    onSuccess: () => {
      toast.success("Đã tạo lịch hẹn cấp cứu.")
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] })
      onClose()
    },
    onError: (e) => {
      const msg = getErrorMessage(e, "Tạo lịch hẹn thất bại.")
      setErrorMessage(msg)
      toast.error(msg)
    },
  })

  const handleClose = () => {
    if (walkInMutation.isPending || emergencyMutation.isPending) return
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const isLoading = walkInMutation.isPending || emergencyMutation.isPending

  const handleSubmit = () => {
    if (!selectedPet) {
      toast.error("Vui lòng chọn thú cưng.")
      return
    }
    setErrorMessage("")
    if (type === "emergency") {
      emergencyMutation.mutate()
    } else {
      walkInMutation.mutate()
    }
  }

  if (!isOpen) return null

  const isEmergency = type === "emergency"
  const now = new Date()
  const timeStr = now.toTimeString().slice(0, 5)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={handleBackdropClick}
    >
      <div className="m-auto w-[min(480px,100%)] rounded-[28px] border border-po-border bg-white shadow-2xl shadow-black/20 animate-dialog-content-in overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            "flex items-start justify-between gap-3 border-b border-po-border px-6 py-5",
            isEmergency && "bg-po-danger-soft/30",
          )}
        >
          <div className="flex items-center gap-3">
            {isEmergency ? (
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-danger text-white">
                <AlertTriangle className="size-5" />
              </div>
            ) : (
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary text-white">
                <Plus className="size-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-extrabold text-po-text">
                {isEmergency ? "Tạo lịch cấp cứu" : "Tạo lịch walk-in"}
              </h3>
              <p className="mt-0.5 text-xs text-po-text-muted">
                {isEmergency
                  ? "Tạo lịch hẹn cấp cứu, bỏ qua kiểm tra slot."
                  : "Tạo lịch hẹn cho khách đến trực tiếp."}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="shrink-0 rounded-full p-1.5 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid gap-5">
          {/* Current time info */}
          <div className="flex items-center gap-4 rounded-2xl bg-po-surface-muted/70 px-4 py-3 ring-1 ring-po-border/70">
            <div className="grid size-8 place-items-center rounded-xl bg-po-primary-soft text-po-primary">
              <CalendarCheck className="size-4" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-po-text">
                {now.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
              <p className="text-po-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {timeStr} – Bắt đầu ngay
                </span>
              </p>
            </div>
          </div>

          {/* Pet selector */}
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-po-text">
              Chọn thú cưng <span className="text-po-danger">*</span>
            </p>
            {(!pets || pets.length === 0) ? (
              <p className="text-sm text-po-text-muted">Chưa có thú cưng nào trong hệ thống.</p>
            ) : (
              <div className="grid gap-2">
                {pets.map((pet) => (
                  <button
                    key={pet.petId}
                    onClick={() => setSelectedPet(pet)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                      selectedPet?.petId === pet.petId
                        ? "border-po-primary bg-po-primary-soft ring-2 ring-po-primary/20"
                        : "border-po-border bg-white hover:border-po-primary/50",
                    )}
                  >
                    {pet.avatarUrl ? (
                      <img src={pet.avatarUrl} alt={pet.name} className="size-9 rounded-xl object-cover" />
                    ) : (
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-po-surface-muted text-po-text-muted">
                        <Stethoscope className="size-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-po-text">{pet.name}</p>
                      <p className="text-xs text-po-text-muted">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Appointment type */}
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-po-text">Loại khám</p>
            <div className="flex flex-wrap gap-2">
              {APPOINTMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setAppointmentType(t.value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                    appointmentType === t.value
                      ? "border-po-primary bg-po-primary text-white"
                      : "border-po-border bg-white text-po-text hover:border-po-primary/50",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <p className="text-sm font-semibold text-po-text">Ghi chú (tùy chọn)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Mô tả triệu chứng, tình trạng khẩn cấp..."
              className="w-full resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm text-po-text outline-none transition placeholder:text-po-text-muted/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            />
          </div>

          {errorMessage && (
            <p className="rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
              {errorMessage}
            </p>
          )}

          {isEmergency && (
            <div className="rounded-2xl border border-po-danger/30 bg-po-danger-soft px-4 py-3 text-xs font-semibold text-po-danger">
              Lịch cấp cứu sẽ được tạo ngay và tự động xác nhận. Hệ thống sẽ gửi thông báo cho owner.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-po-border px-6 py-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPet || isLoading}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50",
              isEmergency
                ? "bg-po-danger hover:bg-po-danger/90"
                : "bg-po-primary hover:bg-po-primary-hover",
            )}
          >
            {isLoading ? "Đang tạo..." : isEmergency ? "Tạo lịch cấp cứu" : "Tạo lịch walk-in"}
          </button>
        </div>
      </div>
    </div>
  )
}
