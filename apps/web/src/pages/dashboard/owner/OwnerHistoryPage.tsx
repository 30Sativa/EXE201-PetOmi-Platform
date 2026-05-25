import { useState } from "react"
import { ClipboardList } from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import { useQuery } from "@tanstack/react-query"
import { getOwnerAppointmentsApi } from "@/services/appointments.service"
import { getPetsApi } from "@/services/pets.service"

type StatusFilter = "all" | "completed" | "cancelled"

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

// Mock medical records — backend chưa expose API riêng cho owner
const mockMedicalRecords = [
  {
    clinicName: "PetOmi Clinic Q2",
    diagnosis: "Viêm da nhẹ",
    date: "2026-05-02",
    petName: "Mochi",
  },
  {
    clinicName: "Happy Vet Center",
    diagnosis: "Tiêm phòng định kỳ",
    date: "2026-03-12",
    petName: "Bim",
  },
  {
    clinicName: "Sunrise Vet",
    diagnosis: "Kiểm tra tổng quát",
    date: "2026-02-28",
    petName: "Lily",
  },
  {
    clinicName: "PetOmi Clinic Q2",
    diagnosis: "Tẩy giun",
    date: "2026-01-15",
    petName: "Mochi",
  },
]

export default function OwnerHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["owner-appointments"],
    queryFn: () => getOwnerAppointmentsApi(),
  })

  const { data: pets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const completedOrCancelled = (appointments ?? []).filter(
    (a) =>
      a.status.toLowerCase() === "completed" ||
      a.status.toLowerCase() === "cancelled",
  )

  const filtered =
    statusFilter === "all"
      ? completedOrCancelled
      : completedOrCancelled.filter((a) =>
          statusFilter === "completed"
            ? a.status.toLowerCase() === "completed"
            : a.status.toLowerCase() === "cancelled",
        )

  const getPetName = (petId: string) =>
    pets?.find((p) => p.petId === petId)?.name ?? "Không rõ"

  // Combine real appointments with mock records for richer history
  const allHistory = [
    ...filtered.map((appt) => ({
      id: appt.appointmentId,
      clinicName: "Phòng khám", // API chưa trả clinic name
      diagnosis: appt.appointmentType,
      date: appt.appointmentDate,
      petName: getPetName(appt.petId),
      status: appt.status.toLowerCase() === "completed" ? "completed" : "cancelled",
      isMock: false,
    })),
    ...(statusFilter !== "cancelled"
      ? mockMedicalRecords.map((r, i) => ({
          id: `mock-${i}`,
          clinicName: r.clinicName,
          diagnosis: r.diagnosis,
          date: r.date,
          petName: r.petName,
          status: "completed" as const,
          isMock: true,
        }))
      : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-po-text">Lịch sử khám</h2>
        <p className="mt-1 text-sm text-po-text-muted">
          Xem lại các lần khám đã hoàn thành và đã hủy.
        </p>
      </div>

      {/* Filters */}
      <TabFilter
        tabs={statusFilters}
        activeTab={statusFilter}
        onChange={setStatusFilter}
      />

      {/* History List */}
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
