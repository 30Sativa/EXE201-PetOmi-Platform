import {
  ArrowRight,
  Building2,
  CalendarCheck,
  ClipboardList,
  PawPrint,
  Plus,
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

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }
  return map[status.toLowerCase()] ?? status
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

  const { data: reminders } = useQuery({
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
  const nextAppointments = [...upcomingAppts]
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime(),
    )
    .slice(0, 5)

  const getPetName = (petId: string) => {
    const pet = Array.isArray(pets) ? pets.find((p) => p.petId === petId) : undefined
    return pet?.name ?? "Không rõ"
  }

  return (
    <div className="grid gap-5 md:gap-6">
      <section className="relative overflow-hidden rounded-[34px] text-po-text shadow-sm shadow-orange-200/25 ring-1 ring-po-border/70">
        <img
          src="/hero-pets-new.png"
          alt="Bác sĩ thú y đang kiểm tra sức khỏe cho chó trong phòng khám"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,_rgba(255,250,243,0.97)_0%,_rgba(255,248,239,0.92)_44%,_rgba(255,247,237,0.5)_70%,_rgba(255,247,237,0.05)_100%)]" />

        <div className="relative max-w-2xl p-6 md:p-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-po-primary-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-po-primary ring-1 ring-po-border/60">
            <PawPrint className="size-3.5" />
            Tổng quan hôm nay
          </p>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.05] md:text-[3.25rem]">
            Chăm sóc thú cưng bắt đầu từ những việc nhỏ.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-po-text-muted md:text-base md:leading-8">
            Xem nhanh hồ sơ, lịch khám và nhắc nhở đang cần chú ý để không bỏ sót các mốc chăm sóc quan trọng.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/dashboard/owner/pets?add=1")}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-bold text-white shadow-lg shadow-orange-950/25 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0"
            >
              <Plus className="size-4" />
              Thêm thú cưng
            </button>
            <button
              onClick={() => navigate("/dashboard/owner/appointments")}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white/85 px-6 text-sm font-semibold text-po-text ring-1 ring-po-border/80 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0"
            >
              Xem lịch hẹn
              <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => navigate("/dashboard/owner/register-clinic")}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white/85 px-6 text-sm font-semibold text-po-text ring-1 ring-po-border/80 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0"
            >
              Đăng ký phòng khám
              <Building2 className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Thú cưng đang quản lý"
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
          hint="Đang theo dõi"
        />
      </div>

      {/* Upcoming Appointments */}
      <DashboardSection
        title="Lịch hẹn sắp tới"
        subtitle="Các lịch hẹn được xác nhận trong tháng này"
        action={
          <button
            onClick={() => navigate("/dashboard/owner/appointments")}
            className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
          >
            Xem tất cả
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
            {nextAppointments.map((appt) => (
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
            className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white active:translate-y-0"
          >
            Xem tất cả
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
                onClick={() => navigate("/dashboard/owner/pets?add=1")}
                className="inline-flex h-10 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0"
              >
                Thêm thú cưng
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(pets ?? []).slice(0, 6).map((pet) => (
              <div
                key={pet.petId}
                onClick={() => navigate(`/dashboard/owner/pets/${pet.petId}`)}
                className="flex cursor-pointer items-center gap-3 rounded-2xl bg-po-surface-muted/75 p-4 ring-1 ring-po-border/70 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-orange-200/20"
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-po-surface-muted/70 px-4 py-3 ring-1 ring-po-border/70 transition hover:bg-white hover:shadow-sm hover:shadow-orange-200/20">
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


