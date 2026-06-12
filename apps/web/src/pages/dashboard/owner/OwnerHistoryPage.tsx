import { useState } from "react"
import { ClipboardList } from "lucide-react"
import { useQueries, useQuery } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import { getOwnerAppointmentsApi } from "@/services/appointments.service"
import { getPetTimelineApi, getPetsApi } from "@/services/pets.service"
import type { PetActivityResponse } from "@/types"

type StatusFilter = "all" | "completed" | "cancelled"

interface HistoryItem {
  id: string
  clinicName: string
  diagnosis: string
  date: string
  petName: string
  status: "completed" | "cancelled"
  note?: string | null
}

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
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

const parseMetadata = (metadata: string | null): Record<string, unknown> => {
  if (!metadata) return {}

  try {
    const parsed = JSON.parse(metadata)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

const getMetadataString = (
  metadata: Record<string, unknown>,
  key: string,
) => {
  const value = metadata[key]
  return typeof value === "string" && value.trim() ? value : null
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

  const timelineQueries = useQueries({
    queries: (pets ?? []).map((pet) => ({
      queryKey: ["pet-timeline", pet.petId, "owner-history"],
      queryFn: () => getPetTimelineApi(pet.petId, { page: 1, pageSize: 100 }),
    })),
  })

  const isTimelineLoading = timelineQueries.some((query) => query.isLoading)
  const isLoading = isAppointmentsLoading || isPetsLoading || isTimelineLoading

  const getPetName = (petId: string) =>
    pets?.find((pet) => pet.petId === petId)?.name ?? "Unknown"

  const getAppointmentById = (appointmentId: string | null) =>
    (appointments ?? []).find((appointment) => appointment.appointmentId === appointmentId)

  const completedTimelineHistory: HistoryItem[] = timelineQueries.flatMap((query, index) => {
    const pet = pets?.[index]

    return (query.data?.activities ?? [])
      .filter((activity: PetActivityResponse) =>
        activity.activityType === "MedicalRecord" ||
        activity.activityType === "ClinicExamination",
      )
      .map((activity) => {
        const metadata = parseMetadata(activity.metadata)
        const appointmentId = getMetadataString(metadata, "appointmentId")
        const appointment = appointmentId ? getAppointmentById(appointmentId) : undefined
        const clinicName =
          getMetadataString(metadata, "clinicName") ??
          (activity.activityType === "ClinicExamination" && appointment
            ? "Clinic visit"
            : "Unknown")
        const diagnosis =
          getMetadataString(metadata, "diagnosis") ??
          activity.title

        return {
          id: `${activity.activityType}-${activity.activityId}`,
          clinicName,
          diagnosis,
          date: activity.occurredAt,
          petName: pet?.name ?? getPetName(activity.petId),
          status: "completed" as const,
          note: activity.activityType === "ClinicExamination"
            ? activity.description
            : null,
        }
      })
  })

  const cancelledAppointments: HistoryItem[] = (appointments ?? [])
    .filter((appointment) => appointment.status.toLowerCase() === "cancelled")
    .map((appointment) => ({
      id: `appointment-${appointment.appointmentId}`,
      clinicName: "Clinic",
      diagnosis: appointment.appointmentType,
      date: appointment.appointmentDate,
      petName: getPetName(appointment.petId),
      status: "cancelled" as const,
    }))

  const allHistory = [
    ...(statusFilter !== "cancelled" ? completedTimelineHistory : []),
    ...(statusFilter !== "completed" ? cancelledAppointments : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-po-text">Visit history</h2>
        <p className="mt-1 text-sm text-po-text-muted">
          Review completed owner records, completed clinic examinations, and cancelled appointments.
        </p>
      </div>

      <TabFilter
        tabs={statusFilters}
        activeTab={statusFilter}
        onChange={setStatusFilter}
      />

      <DashboardSection title={`${allHistory.length} records`}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : allHistory.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No visit history yet"
            description="Completed owner records and clinic examinations will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-po-border text-left">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Pet
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Source
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Visit detail
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Date
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
                    Status
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
                    <td className="py-3 text-po-text-muted">
                      <p>{item.diagnosis}</p>
                      {item.note ? (
                        <p className="mt-1 max-w-xl text-xs text-po-text-subtle">
                          {item.note}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 text-po-text-muted">{formatDate(item.date)}</td>
                    <td className="py-3">
                      <StatusBadge
                        variant={item.status === "completed" ? "success" : "danger"}
                        label={item.status === "completed" ? "Completed" : "Cancelled"}
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
