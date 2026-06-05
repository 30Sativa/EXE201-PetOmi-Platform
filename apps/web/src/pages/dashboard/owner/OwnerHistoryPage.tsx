import { useState } from "react"
import { ClipboardList } from "lucide-react"
import { useQueries, useQuery } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import { getOwnerAppointmentsApi } from "@/services/appointments.service"
import { getPetMedicalRecordsApi, getPetsApi } from "@/services/pets.service"

type StatusFilter = "all" | "completed" | "cancelled"

interface HistoryItem {
  id: string
  clinicName: string
  diagnosis: string
  date: string
  petName: string
  status: "completed" | "cancelled"
}

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
]

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export default function OwnerHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ["owner-appointments"],
    queryFn: () => getOwnerAppointmentsApi(),
  })

  const { data: pets, isLoading: isPetsLoading } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const medicalRecordQueries = useQueries({
    queries: (pets ?? []).map((pet) => ({
      queryKey: ["pet-medical-records", pet.petId],
      queryFn: () => getPetMedicalRecordsApi(pet.petId),
    })),
  })

  const isMedicalRecordsLoading = medicalRecordQueries.some((query) => query.isLoading)
  const isLoading = isAppointmentsLoading || isPetsLoading || isMedicalRecordsLoading

  const getPetName = (petId: string) =>
    pets?.find((pet) => pet.petId === petId)?.name ?? "Không rõ"

  const medicalHistory: HistoryItem[] = medicalRecordQueries.flatMap((query, index) => {
    const pet = pets?.[index]
    return (query.data ?? []).map((record) => ({
      id: `record-${record.medicalRecordId}`,
      clinicName: record.clinicName?.trim() || "Không rõ",
      diagnosis: record.title,
      date: record.recordDate,
      petName: pet?.name ?? getPetName(record.petId),
      status: "completed" as const,
    }))
  })

  const cancelledAppointments: HistoryItem[] = (appointments ?? [])
    .filter((appointment) => appointment.status.toLowerCase() === "cancelled")
    .map((appointment) => ({
      id: `appointment-${appointment.appointmentId}`,
      clinicName: "Phòng khám",
      diagnosis: appointment.appointmentType,
      date: appointment.appointmentDate,
      petName: getPetName(appointment.petId),
      status: "cancelled" as const,
    }))

  const allHistory = [
    ...(statusFilter !== "cancelled" ? medicalHistory : []),
    ...(statusFilter !== "completed" ? cancelledAppointments : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-po-text">Lịch sử khám</h2>
        <p className="mt-1 text-sm text-po-text-muted">
          Xem lại các lần khám đã hoàn thành và lịch đã hủy.
        </p>
      </div>

      <TabFilter
        tabs={statusFilters}
        activeTab={statusFilter}
        onChange={setStatusFilter}
      />

      <DashboardSection title={`${allHistory.length} bản ghi`}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : allHistory.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Chưa có lịch sử khám"
            description="Các lần khám đã hoàn thành sẽ xuất hiện ở đây."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-po-border text-left">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Thú cưng
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Phòng khám
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Nội dung khám
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Ngày
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-po-border">
                {allHistory.map((item) => (
                  <tr key={item.id} className="transition hover:bg-po-surface-muted">
                    <td className="py-3">
                      <p className="font-semibold text-po-text">{item.petName}</p>
                    </td>
                    <td className="py-3 text-po-text-muted">{item.clinicName}</td>
                    <td className="py-3 text-po-text-muted">{item.diagnosis}</td>
                    <td className="py-3 text-po-text-muted">{formatDate(item.date)}</td>
                    <td className="py-3">
                      <StatusBadge
                        variant={item.status === "completed" ? "success" : "danger"}
                        label={item.status === "completed" ? "Hoàn thành" : "Đã hủy"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>
    </div>
  )
}
