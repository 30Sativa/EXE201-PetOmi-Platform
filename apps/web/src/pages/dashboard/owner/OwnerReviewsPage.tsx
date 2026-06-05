import { useState } from "react"
import { MessageSquare, Search, Star } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { getOwnerAppointmentsApi } from "@/services/appointments.service"
import { getPetsApi } from "@/services/pets.service"

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

export default function OwnerReviewsPage() {
  const [search, setSearch] = useState("")

  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ["owner-appointments"],
    queryFn: () => getOwnerAppointmentsApi(),
  })

  const { data: pets, isLoading: isPetsLoading } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const getPetName = (petId: string) =>
    pets?.find((pet) => pet.petId === petId)?.name ?? "Không rõ"

  const completedAppointments = (appointments ?? [])
    .filter((appointment) => appointment.status.toLowerCase() === "completed")
    .map((appointment) => ({
      ...appointment,
      petName: getPetName(appointment.petId),
    }))

  const filteredAppointments = completedAppointments.filter(
    (appointment) =>
      search === "" ||
      appointment.petName.toLowerCase().includes(search.toLowerCase()) ||
      appointment.appointmentType.toLowerCase().includes(search.toLowerCase()),
  )

  const isLoading = isAppointmentsLoading || isPetsLoading

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Đánh giá của tôi</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Xem các lượt khám đã hoàn tất trước khi gửi đánh giá cho phòng khám.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Đánh giá đã gửi</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">0</p>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Điểm trung bình</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-extrabold text-po-text">-</p>
            <Star className="size-5 text-po-border-strong" />
          </div>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Lượt khám đủ điều kiện</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">
            {completedAppointments.length}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Tìm kiếm lượt khám..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 w-full rounded-full border border-po-border bg-white px-4 pl-10 text-sm"
        />
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
      </div>

      <DashboardSection title={`${filteredAppointments.length} lượt khám`}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Chưa có lượt khám đủ điều kiện"
            description="Bạn có thể đánh giá sau khi lịch khám được hoàn tất."
          />
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.appointmentId}
                className="rounded-2xl border border-po-border bg-white p-4 transition hover:border-po-border-strong"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-po-text">{appointment.appointmentType}</p>
                    <p className="mt-0.5 text-xs text-po-text-muted">
                      {appointment.petName} · {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>
                  <StatusBadge variant="success" label="Đã khám" />
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}
