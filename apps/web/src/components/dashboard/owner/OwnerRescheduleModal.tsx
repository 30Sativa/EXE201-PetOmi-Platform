import { useEffect, useState } from "react"
import { CalendarCheck, Clock, X } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/utils"
import {
  getAvailableSlotsApi,
  rescheduleAppointmentApi,
} from "@/services/appointments.service"
import { getMyClinicApi } from "@/services/clinic.service"
import type {
  AppointmentListItemResponse,
  AvailableSlotResponse,
} from "@/types"

interface OwnerRescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentListItemResponse | null
  petName: string
}

export default function OwnerRescheduleModal({
  isOpen,
  onClose,
  appointment,
  petName,
}: OwnerRescheduleModalProps) {
  const queryClient = useQueryClient()

  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!isOpen) {
      queueMicrotask(() => {
        setSelectedDate("")
        setSelectedSlot(null)
        setErrorMessage("")
      })
    }
  }, [isOpen])

  const { data: myClinic } = useQuery({
    queryKey: ["owner", "my-clinic"],
    queryFn: getMyClinicApi,
    retry: false,
  })

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ["available-slots-reschedule", appointment?.appointmentId, selectedDate],
    queryFn: () =>
      getAvailableSlotsApi({
        clinicId: myClinic?.clinicId ?? "",
        date: selectedDate,
      }),
    enabled: Boolean(isOpen && myClinic?.clinicId && selectedDate !== ""),
  })

  const rescheduleMutation = useMutation({
    mutationFn: () => {
      if (!appointment || !selectedDate || !selectedSlot) {
        return Promise.reject(new Error("Thiếu thông tin đổi lịch."))
      }
      return rescheduleAppointmentApi(appointment.appointmentId, {
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      })
    },
    onSuccess: () => {
      toast.success("Đổi lịch hẹn thành công!")
      queryClient.invalidateQueries({ queryKey: ["owner-appointments"] })
      onClose()
    },
    onError: (error) => {
      const msg = getErrorMessage(error, "Đổi lịch thất bại. Vui lòng thử lại.")
      setErrorMessage(msg)
      toast.error(msg)
    },
  })

  const handleClose = () => {
    if (rescheduleMutation.isPending) return
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = today.toISOString().split("T")[0]
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  const formatDateDisplay = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr: string) => timeStr.slice(0, 5)

  const availableSlots = Array.isArray(slots) ? slots : []

  if (!isOpen || !appointment) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={handleBackdropClick}
    >
      <div className="m-auto w-[min(480px,100%)] rounded-[28px] border border-po-border bg-white shadow-2xl shadow-black/20 animate-dialog-content-in overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-po-border px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Đổi lịch hẹn</h3>
            <p className="mt-1 text-xs text-po-text-muted">
              Chọn ngày và giờ mới cho lịch hẹn của {petName}.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={rescheduleMutation.isPending}
            className="shrink-0 rounded-full p-1.5 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Current appointment info */}
          <div className="mb-5 rounded-2xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-po-text-subtle">
              Lịch hẹn hiện tại
            </p>
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-po-text">
                  {formatDateDisplay(appointment.appointmentDate)}
                </p>
                <p className="text-xs text-po-text-muted">
                  {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Date picker */}
          <div className="mb-4 grid gap-1.5">
            <p className="text-sm font-semibold text-po-text">Chọn ngày mới</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setSelectedSlot(null)
              }}
              min={minDate}
              max={maxDateStr}
              className="h-11 w-full cursor-pointer rounded-2xl border border-po-border bg-white px-4 text-sm text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            />
          </div>

          {/* Slot picker */}
          {selectedDate && (
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-po-text">
                Chọn giờ mới
              </p>

              {loadingSlots ? (
                <div className="flex justify-center py-6">
                  <div className="size-6 animate-spin rounded-full border-2 border-po-border border-t-po-primary" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="py-4 text-center text-sm text-po-text-muted">
                  Không có slot trống vào ngày này. Vui lòng chọn ngày khác.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot, i) => {
                    const isSelected =
                      selectedSlot &&
                      slot.startTime === selectedSlot.startTime &&
                      slot.endTime === selectedSlot.endTime
                    return (
                      <button
                        key={`${slot.startTime}-${i}`}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "flex flex-col items-center rounded-2xl border p-2.5 text-sm font-semibold transition",
                          isSelected
                            ? "border-po-primary bg-po-primary text-white"
                            : "border-po-border bg-white text-po-text hover:border-po-primary/50",
                        )}
                      >
                        <CalendarCheck className="mb-1 size-4" />
                        {formatTime(slot.startTime)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <p className="mt-3 rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-po-border px-6 py-4">
          <button
            onClick={handleClose}
            disabled={rescheduleMutation.isPending}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
          >
            Hủy
          </button>
          <button
            onClick={() => rescheduleMutation.mutate()}
            disabled={!selectedDate || !selectedSlot || rescheduleMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-sm shadow-orange-200/40 transition hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {rescheduleMutation.isPending ? "Đang đổi lịch..." : "Xác nhận đổi lịch"}
          </button>
        </div>
      </div>
    </div>
  )
}
