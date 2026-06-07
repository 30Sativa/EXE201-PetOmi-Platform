import { useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { CalendarPlus, Stethoscope, Trash2, UserPlus } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { getErrorMessage } from "@/lib/utils"
import {
  assignClinicStaffApi,
  deleteDoctorScheduleApi,
  getClinicDoctorsInternalApi,
  getClinicScheduleApi,
  getMyClinicApi,
  setDoctorScheduleApi,
} from "@/services/clinic.service"
import type { ClinicDoctorListItemResponse, DoctorScheduleResponse } from "@/types"

type StaffForm = {
  vetProfileId: string
  role: string
}

type ScheduleForm = {
  vetClinicId: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

const roleOptions = ["PrimaryVet", "Assistant"]
const dayOptions = [
  { value: "0", label: "Chủ nhật" },
  { value: "1", label: "Thứ 2" },
  { value: "2", label: "Thứ 3" },
  { value: "3", label: "Thứ 4" },
  { value: "4", label: "Thứ 5" },
  { value: "5", label: "Thứ 6" },
  { value: "6", label: "Thứ 7" },
]

function formatTime(value: string) {
  return value?.slice(0, 5) ?? ""
}

export default function ClinicVetsPage() {
  const queryClient = useQueryClient()
  const [staffForm, setStaffForm] = useState<StaffForm>({
    vetProfileId: "",
    role: "PrimaryVet",
  })
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    vetClinicId: "",
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "17:00",
  })
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<{ vetClinicId: string; schedule: DoctorScheduleResponse } | null>(null)

  const { data: myClinic, isLoading: loadingClinic } = useQuery({
    queryKey: ["owner", "my-clinic"],
    queryFn: getMyClinicApi,
    retry: false,
  })

  const clinicId = myClinic?.clinicId ?? ""
  const isApproved = myClinic?.status?.toLowerCase() === "approved"

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ["clinic", "doctors", clinicId],
    queryFn: () => getClinicDoctorsInternalApi(clinicId),
    enabled: clinicId !== "",
  })

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["clinic", "schedules", clinicId],
    queryFn: () => getClinicScheduleApi(clinicId),
    enabled: clinicId !== "",
  })

  const schedulesByVetClinic = useMemo(() => {
    return schedules.reduce<Record<string, DoctorScheduleResponse[]>>((acc, schedule) => {
      acc[schedule.vetClinicId] ??= []
      acc[schedule.vetClinicId].push(schedule)
      return acc
    }, {})
  }, [schedules])

  const invalidateStaff = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["clinic", "doctors", clinicId] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", "schedules", clinicId] }),
    ])
  }

  const assignMutation = useMutation({
    mutationFn: () =>
      assignClinicStaffApi(clinicId, {
        vetProfileId: staffForm.vetProfileId.trim(),
        role: staffForm.role,
      }),
    onSuccess: async () => {
      toast.success("Đã thêm bác sĩ vào phòng khám.")
      setStaffForm({ vetProfileId: "", role: "PrimaryVet" })
      await invalidateStaff()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gán bác sĩ thất bại.")),
  })

  const scheduleMutation = useMutation({
    mutationFn: () =>
      setDoctorScheduleApi(clinicId, scheduleForm.vetClinicId, {
        dayOfWeek: Number(scheduleForm.dayOfWeek),
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
      }),
    onSuccess: async () => {
      toast.success("Đã thêm ca làm việc.")
      await invalidateStaff()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Thêm ca làm việc thất bại.")),
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: ({ vetClinicId, scheduleId }: { vetClinicId: string; scheduleId: string }) =>
      deleteDoctorScheduleApi(clinicId, vetClinicId, scheduleId),
    onSuccess: async () => {
      toast.success("Đã xóa ca làm việc.")
      setDeleteScheduleTarget(null)
      await invalidateStaff()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Xóa ca làm việc thất bại.")),
  })

  const updateStaffValue =
    (field: keyof StaffForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setStaffForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const updateScheduleValue =
    (field: keyof ScheduleForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setScheduleForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleAssignStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!staffForm.vetProfileId.trim()) {
      toast.error("Nhập VetProfileId của bác sĩ.")
      return
    }
    assignMutation.mutate()
  }

  const handleSetSchedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!scheduleForm.vetClinicId) {
      toast.error("Chọn bác sĩ cần thêm lịch.")
      return
    }
    if (scheduleForm.startTime >= scheduleForm.endTime) {
      toast.error("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.")
      return
    }
    scheduleMutation.mutate()
  }

  if (loadingClinic || loadingDoctors || loadingSchedules) {
    return (
      <div className="flex justify-center rounded-[30px] bg-white/88 py-16 ring-1 ring-po-border/80">
        <LoadingSpinner />
      </div>
    )
  }

  if (!myClinic) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="Chưa có phòng khám"
        description="Tạo và được duyệt phòng khám trước khi quản lý bác sĩ."
      />
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Nhân sự active" value={String(doctors.length)} />
        <SummaryCard label="Ca làm việc" value={String(schedules.length)} />
        <SummaryCard label="Trạng thái phòng khám" value={myClinic.status} />
      </div>

      <DashboardSection
        title="Thêm bác sĩ vào phòng khám"
        subtitle="BE hiện nhận trực tiếp VetProfileId, nên FE để nhập ID này cho đến khi có API tìm bác sĩ."
      >
        <form onSubmit={handleAssignStaff} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
          <InputField
            label="VetProfileId"
            value={staffForm.vetProfileId}
            onChange={updateStaffValue("vetProfileId")}
            placeholder="GUID VetProfile"
          />
          <label className="grid gap-1.5 text-sm font-semibold text-po-text">
            <span>Vai trò</span>
            <select
              value={staffForm.role}
              onChange={updateStaffValue("role")}
              className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={!isApproved || assignMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="size-4" />
            Gán bác sĩ
          </button>
        </form>
      </DashboardSection>

      <DashboardSection title="Thêm lịch làm việc" subtitle="Thiết lập ca làm việc theo tuần cho từng bác sĩ trong phòng khám.">
        <form onSubmit={handleSetSchedule} className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_1fr_1fr_1fr_auto] md:items-end">
          <label className="grid gap-1.5 text-sm font-semibold text-po-text">
            <span>Bác sĩ</span>
            <select
              value={scheduleForm.vetClinicId}
              onChange={updateScheduleValue("vetClinicId")}
              className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            >
              <option value="">Chọn bác sĩ</option>
              {doctors.map((doctor) => (
                <option key={doctor.vetClinicId} value={doctor.vetClinicId}>
                  {doctor.fullName} - {doctor.roleName}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-po-text">
            <span>Ngày</span>
            <select
              value={scheduleForm.dayOfWeek}
              onChange={updateScheduleValue("dayOfWeek")}
              className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            >
              {dayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <InputField label="Bắt đầu" value={scheduleForm.startTime} onChange={updateScheduleValue("startTime")} type="time" />
          <InputField label="Kết thúc" value={scheduleForm.endTime} onChange={updateScheduleValue("endTime")} type="time" />
          <button
            type="submit"
            disabled={!isApproved || scheduleMutation.isPending || doctors.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarPlus className="size-4" />
            Thêm ca
          </button>
        </form>
      </DashboardSection>

      <DashboardSection title="Danh sách bác sĩ" subtitle="Theo dõi nhân sự active và các ca làm việc hiện tại.">
        {doctors.length === 0 ? (
          <EmptyState icon={Stethoscope} title="Chưa có bác sĩ" description="Gán bác sĩ đầu tiên để bắt đầu tạo lịch làm việc." />
        ) : (
          <div className="grid gap-4">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.vetClinicId}
                doctor={doctor}
                schedules={schedulesByVetClinic[doctor.vetClinicId] ?? []}
                isDeleting={deleteScheduleMutation.isPending}
                onDeleteSchedule={(schedule) => setDeleteScheduleTarget({ vetClinicId: doctor.vetClinicId, schedule })}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      <ConfirmDialog
        isOpen={deleteScheduleTarget !== null}
        onClose={() => setDeleteScheduleTarget(null)}
        onConfirm={() => {
          if (deleteScheduleTarget) {
            deleteScheduleMutation.mutate({
              vetClinicId: deleteScheduleTarget.vetClinicId,
              scheduleId: deleteScheduleTarget.schedule.scheduleId,
            })
          }
        }}
        title="Xóa ca làm việc"
        description={`Bạn có chắc muốn xóa ca ${deleteScheduleTarget?.schedule.dayName ?? ""} ${deleteScheduleTarget ? `${formatTime(deleteScheduleTarget.schedule.startTime)} - ${formatTime(deleteScheduleTarget.schedule.endTime)}` : ""}?`}
        confirmLabel="Xóa ca"
        variant="danger"
        isLoading={deleteScheduleMutation.isPending}
      />
    </div>
  )
}

function DoctorCard({
  doctor,
  schedules,
  isDeleting,
  onDeleteSchedule,
}: {
  doctor: ClinicDoctorListItemResponse
  schedules: DoctorScheduleResponse[]
  isDeleting: boolean
  onDeleteSchedule: (schedule: DoctorScheduleResponse) => void
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-po-border/80">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-po-primary-soft text-po-primary">
            {doctor.avatarUrl ? (
              <img src={doctor.avatarUrl} alt={doctor.fullName} className="h-full w-full object-cover" />
            ) : (
              <Stethoscope className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-po-text">{doctor.fullName}</p>
            <p className="mt-1 text-xs text-po-text-muted">{doctor.specialization ?? "Chưa có chuyên môn"}</p>
            <p className="mt-1 text-[11px] text-po-text-subtle">VetProfileId: {doctor.vetProfileId}</p>
          </div>
        </div>
        <StatusBadge variant="info" label={doctor.roleName} />
      </div>

      <div className="mt-4 grid gap-2">
        {schedules.length === 0 ? (
          <p className="rounded-2xl bg-po-surface-muted px-4 py-3 text-xs font-semibold text-po-text-muted">
            Chưa có ca làm việc.
          </p>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.scheduleId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-po-surface-muted px-4 py-3"
            >
              <div className="text-sm font-semibold text-po-text">
                {schedule.dayName}: {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
              </div>
              <button
                type="button"
                onClick={() => onDeleteSchedule(schedule)}
                disabled={isDeleting}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-po-danger ring-1 ring-po-border/70 transition hover:bg-po-danger-soft disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] bg-white/85 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
      <p className="text-sm font-semibold text-po-text-muted">{label}</p>
      <p className="mt-3 truncate text-3xl font-extrabold text-po-text">{value}</p>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      <span>{label}</span>
      <input
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-muted/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}
