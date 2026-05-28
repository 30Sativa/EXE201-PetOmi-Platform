import { useState } from "react"
import { Plus, CalendarCheck, CalendarCog, X } from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge, { appointmentStatusVariant } from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import OwnerBookAppointmentModal from "@/components/dashboard/owner/OwnerBookAppointmentModal"
import OwnerRescheduleModal from "@/components/dashboard/owner/OwnerRescheduleModal"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getOwnerAppointmentsApi, cancelAppointmentApi } from "@/services/appointments.service"
import { getPetsApi } from "@/services/pets.service"
import type { AppointmentListItemResponse } from "@/types"

type StatusFilter = "all" | "upcoming" | "pending" | "confirmed" | "completed" | "cancelled"

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "upcoming", label: "Sắp tới" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
]

const formatDate = (dateStr: string) => {
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

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }
  return map[status.toLowerCase()] ?? status
}

export default function OwnerAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [cancelTarget, setCancelTarget] = useState<AppointmentListItemResponse | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentListItemResponse | null>(null)
  const queryClient = useQueryClient()

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ["owner-appointments"],
    queryFn: () => getOwnerAppointmentsApi(),
  })

  const { data: pets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelAppointmentApi(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-appointments"] })
      setCancelTarget(null)
      setCancelReason("")
    },
  })

  const now = new Date()
  const filtered = (appointments ?? []).filter((appt) => {
    switch (statusFilter) {
      case "all":
        return true
      case "upcoming": {
        const apptDate = new Date(appt.appointmentDate)
        return apptDate >= now && appt.status.toLowerCase() !== "cancelled"
      }
      case "pending":
        return appt.status.toLowerCase() === "pending"
      case "confirmed":
        return appt.status.toLowerCase() === "confirmed"
      case "completed":
        return appt.status.toLowerCase() === "completed"
      case "cancelled":
        return appt.status.toLowerCase() === "cancelled"
      default:
        return true
    }
  })

  const getPetName = (petId: string) =>
    pets?.find((p) => p.petId === petId)?.name ?? "Không rõ"

  const canCancel = (appt: AppointmentListItemResponse) => {
    const apptDate = new Date(appt.appointmentDate)
    return (
      apptDate > now &&
      (appt.status.toLowerCase() === "pending" ||
        appt.status.toLowerCase() === "confirmed")
    )
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Lịch hẹn</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Xem, đặt và quản lý lịch hẹn khám cho thú cưng.
          </p>
        </div>
        <button
          onClick={() => setIsBookingOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
        >
          <Plus className="size-4" />
          Đặt lịch hẹn
        </button>
      </div>

      {/* Filters */}
      <TabFilter
        tabs={statusFilters}
        activeTab={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Appointment List */}
      <DashboardSection
        title={`${filtered.length} lịch hẹn`}
        subtitle={
          statusFilter !== "all"
            ? statusFilters.find((f) => f.value === statusFilter)?.label
            : "Tất cả lịch hẹn"
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            icon={CalendarCheck}
            title="Không thể tải lịch hẹn"
            description="Đã xảy ra lỗi. Vui lòng thử lại."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Không có lịch hẹn nào"
            description="Hãy đặt lịch hẹn để chăm sóc thú cưng của bạn."
            action={
              <button
                onClick={() => setIsBookingOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
              >
                <Plus className="size-4" />
                Đặt lịch hẹn
              </button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((appt) => (
              <AppointmentCard
                key={appt.appointmentId}
                appt={appt}
                petName={getPetName(appt.petId)}
                canCancel={canCancel(appt)}
                onCancel={() => setCancelTarget(appt)}
                onReschedule={() => setRescheduleTarget(appt)}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={cancelTarget !== null}
        onClose={() => {
          setCancelTarget(null)
          setCancelReason("")
        }}
        onConfirm={() => {
          if (cancelTarget) {
            cancelMutation.mutate({
              id: cancelTarget.appointmentId,
              reason: cancelReason,
            })
          }
        }}
        title="Hủy lịch hẹn"
        description={`Bạn có chắc muốn hủy lịch hẹn của ${cancelTarget ? getPetName(cancelTarget.petId) : ""}?`}
        confirmLabel="Hủy lịch hẹn"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />

      <OwnerBookAppointmentModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <OwnerRescheduleModal
        isOpen={rescheduleTarget !== null}
        onClose={() => setRescheduleTarget(null)}
        appointment={rescheduleTarget}
        petName={rescheduleTarget ? getPetName(rescheduleTarget.petId) : ""}
      />
    </div>
  )
}

function AppointmentCard({
  appt,
  petName,
  canCancel,
  onCancel,
  onReschedule,
}: {
  appt: AppointmentListItemResponse
  petName: string
  canCancel: boolean
  onCancel: () => void
  onReschedule: () => void
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-po-border bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <CalendarCheck className="size-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-po-text">{petName}</p>
            <StatusBadge
              variant={appointmentStatusVariant(appt.status)}
              label={getStatusLabel(appt.status)}
            />
            {appt.isWalkIn && (
              <span className="rounded-full bg-po-accent-soft px-2.5 py-0.5 text-xs font-medium text-po-accent">
                Walk-in
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-po-text-muted">{appt.appointmentType}</p>
          <p className="mt-2 text-xs text-po-text-subtle">
            {formatDate(appt.appointmentDate)} · {formatTime(appt.startTime)} –{" "}
            {formatTime(appt.endTime)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canCancel && (
          <>
            <button
              onClick={onReschedule}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border px-3 text-xs font-semibold text-po-primary transition hover:border-po-primary hover:bg-po-primary-soft"
            >
              <CalendarCog className="size-3" />
              Đổi lịch
            </button>
            <button
              onClick={onCancel}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border px-3 text-xs font-semibold text-po-danger transition hover:border-po-danger hover:bg-po-danger-soft"
            >
              <X className="size-3" />
              Hủy
            </button>
          </>
        )}
      </div>
    </div>
  )
}
