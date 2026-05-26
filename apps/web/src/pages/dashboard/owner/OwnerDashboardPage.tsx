import {
  CalendarCheck,
  ClipboardList,
  PawPrint,
  TrendingUp,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import StatCard from "@/components/dashboard/StatCard"
import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import Avatar from "@/components/ui/Avatar"
import StatusBadge, {
  appointmentStatusVariant,
} from "@/components/ui/StatusBadge"
import { useQuery } from "@tanstack/react-query"
import { getPetsApi } from "@/services/pets.service"
import { getOwnerAppointmentsApi } from "@/services/appointments.service"
import { getRemindersApi } from "@/services/reminders.service"
import { cn } from "@/lib/utils"
import type { AppointmentListItemResponse } from "@/types"

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    })
  } catch {
    return dateStr
  }
}

const formatTime = (timeStr: string) => {
  return timeStr.slice(0, 5)
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate()

  const { data: pets, isLoading: loadingPets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["owner-appointments"],
    queryFn: () => getOwnerAppointmentsApi(),
  })

  const { data: reminders, isLoading: loadingReminders } = useQuery({
    queryKey: ["owner-reminders"],
    queryFn: getRemindersApi,
  })

  const now = new Date()
  const appointmentsArr = Array.isArray(appointments) ? appointments : []
  const upcomingAppts = appointmentsArr.filter((a) => {
    const apptDate = new Date(a.appointmentDate)
    return apptDate >= now && a.status.toLowerCase() !== "cancelled"
  })

  const completedCount = appointmentsArr.filter(
    (a) => a.status.toLowerCase() === "completed",
  ).length

  const upcomingCount = upcomingAppts.length
  const totalPets = Array.isArray(pets) ? pets.length : 0
  const activeReminders = Array.isArray(reminders)
    ? reminders.filter(
        (r) => r.status.toLowerCase() === "pending",
      ).length
    : 0

  const getPetName = (petId: string) => {
    const pet = Array.isArray(pets) ? pets.find((p) => p.petId === petId) : undefined
    return pet?.name ?? "Không rõ"
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    }
    return map[status.toLowerCase()] ?? status
  }

  const isLoading = loadingPets || loadingAppts || loadingReminders

  return (
    <div className="grid gap-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pets đang quản lý"
          value={String(totalPets)}
          icon={PawPrint}
          hint="Thú cưng của bạn"
        />
        <StatCard
          label="Lịch hẹn sắp tới"
          value={String(upcomingCount)}
          icon={CalendarCheck}
          hint="Trong tháng này"
        />
        <StatCard
          label="Lịch sử khám"
          value={String(completedCount)}
          icon={ClipboardList}
          hint="Đã hoàn thành"
        />
        <StatCard
          label="Nhắc nhở đang hoạt động"
          value={String(activeReminders)}
          icon={TrendingUp}
          hint="Reminders"
        />
      </div>

      {/* Upcoming Appointments */}
      <DashboardSection
        title="Lịch hẹn sắp tới"
        subtitle="Các lịch hẹn được xác nhận trong tháng này"
        action={
          <button
            onClick={() => navigate("/dashboard/owner/appointments")}
            className="text-xs font-semibold text-po-primary transition hover:text-po-primary-hover"
          >
            Xem tất cả →
          </button>
        }
      >
        {loadingAppts ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : upcomingAppts.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Không có lịch hẹn sắp tới"
            description="Hãy đặt lịch hẹn để chăm sóc thú cưng của bạn."
          />
        ) : (
          <div className="grid gap-3">
            {upcomingAppts.slice(0, 5).map((appt) => (
              <AppointmentRow key={appt.appointmentId} appt={appt} petName={getPetName(appt.petId)} />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Pets */}
      <DashboardSection
        title="Thú cưng của bạn"
        subtitle="Quản lý hồ sơ sức khỏe và lịch tiêm phòng"
        action={
          <button
            onClick={() => navigate("/dashboard/owner/pets")}
            className="text-xs font-semibold text-po-primary transition hover:text-po-primary-hover"
          >
            Xem tất cả →
          </button>
        }
      >
        {loadingPets ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : Array.isArray(pets) && pets.length === 0 ? (
          <EmptyState
            icon={PawPrint}
            title="Chưa có thú cưng"
            description="Thêm thú cưng đầu tiên để bắt đầu."
            action={
              <button
                onClick={() => navigate("/dashboard/owner/pets")}
                className="inline-flex h-10 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
              >
                Thêm thú cưng
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pets.slice(0, 6).map((pet) => (
              <div
                key={pet.petId}
                onClick={() => navigate(`/dashboard/owner/pets/${pet.petId}`)}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-po-border bg-po-surface-muted p-4 transition hover:border-po-border-strong hover:shadow-sm"
              >
                <Avatar
                  src={pet.avatarUrl}
                  alt={pet.name}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-po-text">
                    {pet.name}
                  </p>
                  <p className="truncate text-xs text-po-text-muted">
                    {pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}

function AppointmentRow({
  appt,
  petName,
}: {
  appt: AppointmentListItemResponse
  petName: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-po-text">{petName}</p>
          <StatusBadge
            variant={appointmentStatusVariant(appt.status)}
            label={getStatusLabel(appt.status)}
          />
        </div>
        <p className="mt-0.5 text-xs text-po-text-muted">
          {appt.appointmentType}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-po-text">
          {formatDate(appt.appointmentDate)}
        </p>
        <p className="text-xs text-po-text-muted">
          {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
        </p>
      </div>
    </div>
  )
}
