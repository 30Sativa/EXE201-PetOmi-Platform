import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  Clock,
  Stethoscope,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { staffRoleDescription, staffRoleLabel } from "@/lib/clinicDisplay"
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
import type { ClinicDoctorListItemResponse, DoctorScheduleResponse } from "@/types"

const dayOptions = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
]

const roleOptions = [
  { value: "PrimaryVet", label: "Bác sĩ chính" },
  { value: "Assistant", label: "Tiếp nhận/phụ tá" },
  { value: "Cashier", label: "Thu ngân" },
]

export default function ClinicDoctorsPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [vetEmail, setVetEmail] = useState("")
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
    mutationFn: () => assignClinicStaffApi(clinicId, { vetEmail: vetEmail.trim(), role: staffRole }),
    onSuccess: async () => {
      toast.success("Đã thêm nhân sự vào phòng khám.")
      setVetEmail("")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể thêm nhân sự.")),
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
      deactivateClinicStaffApi(clinicId, vetClinicId, { reason: "Xóa khỏi phòng khám từ trang quản lý nhân sự" }),
    onSuccess: async () => {
      toast.success("Đã xóa nhân sự khỏi phòng khám.")
      await invalidate()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể xóa nhân sự.")),
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

  const doctors = doctorsQuery.data ?? []
  const schedules = scheduleQuery.data ?? []

  const schedulesByDoctor = useMemo(() => {
    return schedules.reduce<Record<string, DoctorScheduleResponse[]>>((acc, schedule) => {
      acc[schedule.vetClinicId] ??= []
      acc[schedule.vetClinicId].push(schedule)
      return acc
    }, {})
  }, [schedules])

  const selectedDoctorSchedules = scheduleTarget ? schedulesByDoctor[scheduleTarget.vetClinicId] ?? [] : []

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={Stethoscope} title="Chưa có phòng khám" description="Bạn cần có hồ sơ phòng khám trước khi quản lý nhân sự." />
  }

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[26px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              Nhân sự phòng khám
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight text-po-text">
              Nhân sự, vai trò và lịch trực
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-po-text-muted">
              Chủ phòng khám thêm, đổi vai trò hoặc xóa nhân sự tại đây. Thu ngân là vai trò riêng cho hóa đơn và đối soát.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:w-[470px]">
            <MetricCard label="Nhân sự hoạt động" value={String(doctors.length)} icon={Users} tone="info" />
            <MetricCard label="Ca trực" value={String(schedules.length)} icon={CalendarClock} tone="success" />
            <MetricCard label="Đang chọn" value={scheduleTarget ? "1" : "0"} icon={UserCheck} tone="warning" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:h-[calc(100dvh-206px)] xl:min-h-[600px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-h-0 overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-po-border/80 px-4 py-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">Danh sách nhân sự</h3>
              <p className="mt-1 text-xs text-po-text-muted">{doctors.length} nhân sự đang hoạt động trong phòng khám.</p>
            </div>
            {scheduleTarget ? (
              <p className="rounded-full bg-po-primary-soft px-3 py-1 text-xs font-bold text-po-primary">
                Đang chọn {scheduleTarget.fullName}
              </p>
            ) : null}
          </div>

          <div className="min-h-0 overflow-y-auto p-4">
            {doctorsQuery.isLoading || scheduleQuery.isLoading ? (
              <RosterSkeleton />
            ) : doctors.length === 0 ? (
              <EmptyState icon={Stethoscope} title="Chưa có nhân sự" description="Thêm bác sĩ, phụ tá hoặc thu ngân để vận hành phòng khám." className="py-14" />
            ) : (
              <div className="grid gap-3">
                {doctors.map((doctor) => (
                  <DoctorRow
                    key={doctor.vetClinicId}
                    doctor={doctor}
                    schedules={schedulesByDoctor[doctor.vetClinicId] ?? []}
                    selected={scheduleTarget?.vetClinicId === doctor.vetClinicId}
                    isBusy={roleMutation.isPending || deactivateMutation.isPending || deleteScheduleMutation.isPending}
                    onSelect={() => setScheduleTarget(doctor)}
                    onChangeRole={(role) => roleMutation.mutate({ vetClinicId: doctor.vetClinicId, role })}
                    onDeactivate={() => deactivateMutation.mutate(doctor.vetClinicId)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
          <section className="rounded-[26px] bg-white/90 p-4 ring-1 ring-po-border/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-po-text">Thêm nhân sự</h3>
                <p className="mt-1 text-xs text-po-text-muted">Dùng email đăng nhập của bác sĩ, phụ tá hoặc thu ngân.</p>
              </div>
              <span className="grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                <UserPlus className="size-5" />
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <Input label="Email nhân sự" value={vetEmail} onChange={setVetEmail} />
              <Select
                label="Vai trò"
                value={staffRole}
                onChange={setStaffRole}
                options={roleOptions}
              />
            </div>

            <button
              onClick={() => assignMutation.mutate()}
              disabled={!vetEmail.trim() || assignMutation.isPending}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:opacity-60 active:translate-y-0"
            >
              <UserPlus className="size-4" />
              {assignMutation.isPending ? "Đang thêm..." : "Thêm nhân sự"}
            </button>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
            <div className="border-b border-po-border/80 px-4 py-3">
              <h3 className="text-base font-extrabold text-po-text">Lịch trực</h3>
              <p className="mt-1 text-xs text-po-text-muted">
                {scheduleTarget ? `Thêm ca cho ${scheduleTarget.fullName}.` : "Chọn bác sĩ ở danh sách bên trái."}
              </p>
            </div>

            <div className="grid min-h-0 content-start gap-4 overflow-y-auto p-4">
              <div className="grid gap-3">
                <Select
                  label="Bác sĩ"
                  value={scheduleTarget?.vetClinicId ?? ""}
                  onChange={(value) => setScheduleTarget(doctors.find((doctor) => doctor.vetClinicId === value) ?? null)}
                  options={[
                    { value: "", label: "Chọn bác sĩ" },
                    ...doctors.map((doctor) => ({ value: doctor.vetClinicId, label: `${doctor.fullName} · ${staffRoleLabel(doctor.roleName)}` })),
                  ]}
                />
                <div className="grid gap-2">
                  <Select
                    label="Ngày"
                    value={String(dayOfWeek)}
                    onChange={(value) => setDayOfWeek(Number(value))}
                    options={dayOptions.map((day) => ({ value: String(day.value), label: day.label }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Bắt đầu" type="time" value={startTime} onChange={setStartTime} />
                    <Input label="Kết thúc" type="time" value={endTime} onChange={setEndTime} />
                  </div>
                </div>
                <button
                  onClick={() => addScheduleMutation.mutate()}
                  disabled={!scheduleTarget || addScheduleMutation.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:opacity-60 active:translate-y-0"
                >
                  <CalendarPlus className="size-4" />
                  {addScheduleMutation.isPending ? "Đang thêm..." : "Thêm ca trực"}
                </button>
              </div>

              <div className="grid gap-2">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-po-text-subtle">
                  Ca của bác sĩ đang chọn
                </p>
                {!scheduleTarget ? (
                  <EmptyState icon={Clock} title="Chưa chọn nhân sự" description="Chọn một nhân sự để xem ca trực riêng." className="py-8" />
                ) : selectedDoctorSchedules.length === 0 ? (
                  <EmptyState icon={CalendarPlus} title="Chưa có ca trực" description="Thêm ca đầu tiên cho bác sĩ này." className="py-8" />
                ) : (
                  selectedDoctorSchedules.map((schedule) => (
                    <SchedulePill
                      key={schedule.scheduleId}
                      schedule={schedule}
                      isDeleting={deleteScheduleMutation.isPending}
                      onDelete={() =>
                        deleteScheduleMutation.mutate({
                          vetClinicId: schedule.vetClinicId,
                          scheduleId: schedule.scheduleId,
                        })
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: "info" | "success" | "warning"
}) {
  const toneClass = {
    info: "bg-po-primary-soft text-po-primary",
    success: "bg-po-success-soft text-po-success",
    warning: "bg-po-warning-soft text-po-warning",
  }[tone]

  return (
    <div className="grid min-h-[76px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[22px] bg-po-surface-muted/60 p-3 ring-1 ring-po-border/70">
      <span className={`grid size-9 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-po-text-muted">{label}</p>
        <p className="mt-1 text-lg font-extrabold leading-none text-po-text">{value}</p>
      </div>
    </div>
  )
}

function DoctorRow({
  doctor,
  schedules,
  selected,
  isBusy,
  onSelect,
  onChangeRole,
  onDeactivate,
}: {
  doctor: ClinicDoctorListItemResponse
  schedules: DoctorScheduleResponse[]
  selected: boolean
  isBusy: boolean
  onSelect: () => void
  onChangeRole: (role: string) => void
  onDeactivate: () => void
}) {
  const isClinicOwner = doctor.roleName === "ClinicOwner"

  return (
    <article className={`grid gap-4 rounded-[22px] p-3 ring-1 transition lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start ${
      selected
        ? "bg-po-primary-soft/55 ring-po-primary/30"
        : "bg-po-surface-muted/45 ring-po-border/70 hover:bg-white hover:shadow-sm hover:shadow-orange-100/70"
    }`}>
      <div className="flex min-w-0 gap-3">
        {doctor.avatarUrl ? (
          <img src={doctor.avatarUrl} alt={doctor.fullName} className="size-14 shrink-0 rounded-2xl border border-po-border object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/70">
            <Stethoscope className="size-5" />
          </span>
        )}

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-extrabold text-po-text">{doctor.fullName}</h4>
            <StatusBadge variant="info" label={staffRoleLabel(doctor.roleName)} />
          </div>
          <p className="mt-1 text-xs font-medium text-po-text-muted">
            {doctor.specialization ?? "Chưa có chuyên môn"} · {formatShortId(doctor.vetClinicId)}
          </p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-po-text-muted">
            {staffRoleDescription(doctor.roleName)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {schedules.length === 0 ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-po-text-subtle ring-1 ring-po-border/70">
                Chưa có ca
              </span>
            ) : (
              schedules.slice(0, 4).map((schedule) => (
                <span key={schedule.scheduleId} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-po-text-muted ring-1 ring-po-border/70">
                  {schedule.dayName} {formatTime(schedule.startTime)}-{formatTime(schedule.endTime)}
                </span>
              ))
            )}
            {schedules.length > 4 ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-po-text-subtle ring-1 ring-po-border/70">
                +{schedules.length - 4} ca
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button
          onClick={onSelect}
          className="inline-flex h-9 items-center rounded-full bg-po-primary px-4 text-xs font-bold text-white transition hover:bg-po-primary-hover active:translate-y-px"
        >
          Chọn lịch
        </button>
        <select
          value={doctor.roleName}
          onChange={(event) => onChangeRole(event.target.value)}
          disabled={isBusy || isClinicOwner}
          className="h-9 rounded-full border border-po-border bg-white px-3 text-xs font-bold text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20 disabled:cursor-not-allowed disabled:bg-po-surface-muted disabled:text-po-text-subtle"
          aria-label={`Vai trò của ${doctor.fullName}`}
        >
          {isClinicOwner ? <option value="ClinicOwner">Chủ phòng khám</option> : null}
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={onDeactivate}
          disabled={isBusy || isClinicOwner}
          title={isClinicOwner ? "Không thể xóa chủ phòng khám khỏi phòng khám." : undefined}
          className="inline-flex h-9 items-center rounded-full bg-po-danger-soft px-4 text-xs font-bold text-po-danger transition hover:bg-po-danger hover:text-white disabled:opacity-60 active:translate-y-px"
        >
          Xóa khỏi phòng khám
        </button>
      </div>
    </article>
  )
}

function SchedulePill({
  schedule,
  isDeleting,
  onDelete,
}: {
  schedule: DoctorScheduleResponse
  isDeleting: boolean
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-po-surface-muted/60 px-3 py-2.5">
      <div>
        <p className="text-sm font-extrabold text-po-text">{schedule.dayName}</p>
        <p className="mt-0.5 text-xs font-medium text-po-text-muted">
          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
        </p>
      </div>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="inline-flex size-8 items-center justify-center rounded-full bg-white text-po-danger ring-1 ring-po-border/70 transition hover:bg-po-danger hover:text-white disabled:opacity-60"
        aria-label={`Xóa ca ${schedule.dayName}`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

function RosterSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid gap-4 rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex gap-3">
            <div className="size-14 animate-pulse rounded-2xl bg-white" />
            <div className="grid flex-1 gap-2">
              <div className="h-4 w-40 animate-pulse rounded-full bg-white" />
              <div className="h-3 w-32 animate-pulse rounded-full bg-white" />
              <div className="h-7 w-64 animate-pulse rounded-full bg-white" />
            </div>
          </div>
          <div className="h-9 w-48 animate-pulse rounded-full bg-white lg:justify-self-end" />
        </div>
      ))}
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
    <label className="grid min-w-0 gap-1.5 text-xs font-bold text-po-text">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 min-w-0 rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20 ${
          type === "time" ? "font-mono tabular-nums" : ""
        }`}
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
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <div className="relative grid min-w-0 gap-1.5 text-xs font-bold text-po-text">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 min-w-0 items-center justify-between gap-2 rounded-2xl border border-po-border bg-white px-3 text-left text-sm font-medium text-po-text outline-none transition hover:border-po-primary/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Chọn"}</span>
        <ChevronDown className={`size-4 shrink-0 text-po-text-subtle transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-po-border bg-white p-1 shadow-xl shadow-orange-200/30">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                option.value === value
                  ? "bg-po-primary text-white"
                  : "text-po-text hover:bg-po-surface-muted"
              }`}
            >
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
