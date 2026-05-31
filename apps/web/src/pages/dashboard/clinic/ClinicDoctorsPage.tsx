import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarPlus, Stethoscope, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { formatShortId, formatTime } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import {
  assignClinicStaffApi,
  deactivateClinicStaffApi,
  deleteDoctorScheduleApi,
  getClinicDoctorsInternalApi,
  getClinicScheduleApi,
  setDoctorScheduleApi,
  updateClinicStaffRoleApi,
} from "@/services/clinic.service"
import type { ClinicDoctorListItemResponse } from "@/types"

const dayOptions = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
]

export default function ClinicDoctorsPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [vetProfileId, setVetProfileId] = useState("")
  const [staffRole, setStaffRole] = useState("PrimaryVet")
  const [scheduleTarget, setScheduleTarget] = useState<ClinicDoctorListItemResponse | null>(null)
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("17:00")

  const doctorsQuery = useQuery({
    queryKey: ["clinic", clinicId, "doctors"],
    queryFn: () => getClinicDoctorsInternalApi(clinicId),
    enabled: Boolean(clinicId),
  })

  const scheduleQuery = useQuery({
    queryKey: ["clinic", clinicId, "schedule"],
    queryFn: () => getClinicScheduleApi(clinicId),
    enabled: Boolean(clinicId),
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "doctors"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "schedule"] }),
    ])
  }

  const assignMutation = useMutation({
    mutationFn: () => assignClinicStaffApi(clinicId, { vetProfileId, role: staffRole }),
    onSuccess: async () => {
      toast.success("Đã gán staff vào clinic.")
      setVetProfileId("")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể gán staff.")),
  })

  const roleMutation = useMutation({
    mutationFn: ({ vetClinicId, role }: { vetClinicId: string; role: string }) =>
      updateClinicStaffRoleApi(clinicId, vetClinicId, { role }),
    onSuccess: async () => {
      toast.success("Đã cập nhật vai trò.")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể cập nhật vai trò.")),
  })

  const deactivateMutation = useMutation({
    mutationFn: (vetClinicId: string) =>
      deactivateClinicStaffApi(clinicId, vetClinicId, { reason: "Ngưng hoạt động từ dashboard clinic" }),
    onSuccess: async () => {
      toast.success("Đã ngưng hoạt động staff.")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể ngưng staff.")),
  })

  const addScheduleMutation = useMutation({
    mutationFn: () => {
      if (!scheduleTarget) return Promise.reject(new Error("Chưa chọn bác sĩ."))
      return setDoctorScheduleApi(clinicId, scheduleTarget.vetClinicId, {
        dayOfWeek,
        startTime,
        endTime,
      })
    },
    onSuccess: async () => {
      toast.success("Đã thêm ca trực.")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể thêm ca trực.")),
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: ({ vetClinicId, scheduleId }: { vetClinicId: string; scheduleId: string }) =>
      deleteDoctorScheduleApi(clinicId, vetClinicId, scheduleId),
    onSuccess: async () => {
      toast.success("Đã xóa ca trực.")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể xóa ca trực.")),
  })

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={Stethoscope} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi quản lý bác sĩ." />
  }

  const doctors = doctorsQuery.data ?? []
  const schedules = scheduleQuery.data ?? []

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-po-text">Bác sĩ và lịch trực</h2>
        <p className="mt-1 text-sm text-po-text-muted">Quản lý staff active, vai trò và lịch làm việc trong tuần.</p>
      </div>

      <section className="rounded-[28px] bg-white/88 p-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.25fr)] xl:items-end">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Gán staff</h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-po-text-muted">
              Nhập VetProfileId đã tồn tại để thêm bác sĩ hoặc trợ lý vào clinic.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
            <Input label="VetProfileId" value={vetProfileId} onChange={setVetProfileId} />
            <Select label="Vai trò" value={staffRole} onChange={setStaffRole} options={[{ value: "PrimaryVet", label: "PrimaryVet" }, { value: "Assistant", label: "Assistant" }]} />
          <button
            onClick={() => assignMutation.mutate()}
            disabled={!vetProfileId.trim() || assignMutation.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            <UserPlus className="size-4" />
            Gán staff
          </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <DashboardSection title={`${doctors.length} staff active`} subtitle="ClinicOwner không thể bị deactivate từ đây.">
          {doctorsQuery.isLoading ? (
            <div className="py-12 text-center"><LoadingSpinner /></div>
          ) : doctors.length === 0 ? (
            <EmptyState icon={Stethoscope} title="Chưa có staff" description="Gán bác sĩ để mở lịch trực và nhận booking." />
          ) : (
            <div className="grid gap-3">
              {doctors.map((doctor) => (
                <div key={doctor.vetClinicId} className="rounded-2xl border border-po-border bg-white px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-po-text">{doctor.fullName}</p>
                      <p className="mt-1 text-xs text-po-text-muted">{doctor.specialization ?? "Chưa có chuyên môn"} · {formatShortId(doctor.vetClinicId)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge variant="info" label={doctor.roleName} />
                        <button onClick={() => setScheduleTarget(doctor)} className="text-xs font-semibold text-po-primary">Chọn lịch trực</button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => roleMutation.mutate({ vetClinicId: doctor.vetClinicId, role: doctor.roleName === "PrimaryVet" ? "Assistant" : "PrimaryVet" })}
                        className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:bg-po-primary hover:text-white"
                      >
                        Đổi vai trò
                      </button>
                      <button
                        onClick={() => deactivateMutation.mutate(doctor.vetClinicId)}
                        className="inline-flex h-9 items-center rounded-full bg-po-danger-soft px-4 text-xs font-semibold text-po-danger transition hover:bg-po-danger hover:text-white"
                      >
                        Ngưng
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Lịch trực"
          subtitle={scheduleTarget ? `Đang chọn ${scheduleTarget.fullName}` : "Chọn một staff để thêm ca trực."}
        >
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Select label="Ngày" value={String(dayOfWeek)} onChange={(value) => setDayOfWeek(Number(value))} options={dayOptions.map((day) => ({ value: String(day.value), label: day.label }))} />
              <Input label="Bắt đầu" type="time" value={startTime} onChange={setStartTime} />
              <Input label="Kết thúc" type="time" value={endTime} onChange={setEndTime} />
            </div>
            <button
              onClick={() => addScheduleMutation.mutate()}
              disabled={!scheduleTarget || addScheduleMutation.isPending}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              <CalendarPlus className="size-4" />
              Thêm ca trực
            </button>
            {scheduleQuery.isLoading ? (
              <div className="py-8 text-center"><LoadingSpinner /></div>
            ) : schedules.length === 0 ? (
              <EmptyState icon={CalendarPlus} title="Chưa có lịch trực" description="Lịch trực sẽ giúp owner chọn slot phù hợp." />
            ) : (
              <div className="grid gap-2">
                {schedules.map((schedule) => (
                  <div key={schedule.scheduleId} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-po-text">{schedule.dayName}</p>
                      <p className="text-xs text-po-text-muted">{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)} · {formatShortId(schedule.vetClinicId)}</p>
                    </div>
                    <button
                      onClick={() => deleteScheduleMutation.mutate({ vetClinicId: schedule.vetClinicId, scheduleId: schedule.scheduleId })}
                      className="rounded-full p-2 text-po-danger transition hover:bg-po-danger-soft"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardSection>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

