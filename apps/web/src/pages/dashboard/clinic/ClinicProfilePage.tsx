import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardPlus,
  Clock3,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import ImageUploadField from "@/components/ui/ImageUploadField"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { formatDate } from "@/lib/format"
import { cn, getErrorMessage } from "@/lib/utils"
import {
  getClinicPublicApi,
  updateClinicInfoApi,
  updateClinicLocationApi,
} from "@/services/clinic.service"

const emptyInfo = {
  clinicName: "",
  address: "",
  phone: "",
  email: "",
  logoUrl: "",
  logoCloudinaryPublicId: "",
  description: "",
  openingHours: "",
}

const emptyLocation = {
  latitude: "",
  longitude: "",
  appointmentBufferMins: "15",
}

const openingHourOptions = [
  { value: "", label: "Chọn giờ mở cửa" },
  { value: "Thứ 2 - Chủ nhật, 08:00 - 20:00", label: "Cả tuần · 08:00 - 20:00" },
  { value: "Thứ 2 - Thứ 7, 08:00 - 18:00", label: "Thứ 2 - Thứ 7 · 08:00 - 18:00" },
  { value: "Thứ 2 - Thứ 6, 08:00 - 17:00", label: "Thứ 2 - Thứ 6 · 08:00 - 17:00" },
  { value: "24/7", label: "Mở cửa 24/7" },
]

const customOpeningHoursValue = "__custom__"

export default function ClinicProfilePage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [infoForm, setInfoForm] = useState(emptyInfo)
  const [locationForm, setLocationForm] = useState(emptyLocation)

  const publicQuery = useQuery({
    queryKey: ["clinic", clinicId, "public"],
    queryFn: () => getClinicPublicApi(clinicId),
    enabled: Boolean(clinicId),
  })

  useEffect(() => {
    if (!clinic) return
    queueMicrotask(() => {
      setInfoForm({
        clinicName: clinic.clinicName ?? "",
        address: clinic.address ?? "",
        phone: clinic.phone ?? "",
        email: clinic.email ?? "",
        logoUrl: clinic.logoUrl ?? "",
        logoCloudinaryPublicId: clinic.logoCloudinaryPublicId ?? "",
        description: publicQuery.data?.description ?? "",
        openingHours: publicQuery.data?.openingHours ?? "",
      })
    })
  }, [clinic, publicQuery.data?.description, publicQuery.data?.openingHours])

  const invalidateProfile = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["clinic", "my-clinic"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "public"] }),
    ])
  }

  const infoMutation = useMutation({
    mutationFn: () =>
      updateClinicInfoApi(clinicId, {
        clinicName: infoForm.clinicName.trim(),
        address: infoForm.address.trim() || null,
        phone: infoForm.phone.trim() || null,
        email: infoForm.email.trim() || null,
        logoUrl: infoForm.logoUrl || null,
        logoCloudinaryPublicId: infoForm.logoCloudinaryPublicId || null,
        description: infoForm.description.trim() || null,
        openingHours: infoForm.openingHours.trim() || null,
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật hồ sơ clinic.")
      await invalidateProfile()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể cập nhật hồ sơ clinic.")),
  })

  const locationMutation = useMutation({
    mutationFn: () =>
      updateClinicLocationApi(clinicId, {
        latitude: locationForm.latitude ? Number(locationForm.latitude) : null,
        longitude: locationForm.longitude ? Number(locationForm.longitude) : null,
        appointmentBufferMins: Number(locationForm.appointmentBufferMins) || 15,
      }),
    onSuccess: async () => {
      toast.success("Đã cập nhật khu vực đặt lịch.")
      await invalidateProfile()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể cập nhật vị trí clinic.")),
  })

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={ClipboardPlus} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi cập nhật thông tin công khai." />
  }

  const canSaveInfo = infoForm.clinicName.trim().length > 1
  const clinicLogo = infoForm.logoUrl || clinic.logoUrl

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[30px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[22px] bg-po-primary-soft text-po-primary ring-1 ring-po-border/80">
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={infoForm.clinicName || clinic.clinicName}
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-7" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-po-text-subtle">
                Hồ sơ clinic
              </p>
              <h2 className="mt-1 truncate text-2xl font-extrabold leading-tight text-po-text">
                {infoForm.clinicName || clinic.clinicName}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-po-text-muted">
                Cập nhật thông tin owner nhìn thấy khi tìm clinic và đặt lịch.
              </p>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl bg-po-surface-muted/70 px-4 py-3 text-sm ring-1 ring-po-border/70 sm:min-w-56">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge variant={clinic.status === "Approved" ? "success" : "warning"} label={clinic.status} />
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-po-text-subtle">
                <CalendarDays className="size-3.5" />
                {formatDate(clinic.createdAt)}
              </span>
            </div>
            <p className="truncate text-xs font-semibold text-po-text-muted">
              {clinic.email || "Chưa có email công khai"}
            </p>
          </div>
        </div>
      </section>

      <DashboardSection
        title="Thông tin công khai"
        subtitle="Tên, logo, mô tả và giờ mở cửa sẽ hiển thị ở booking flow của owner."
      >
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <div className="grid content-start gap-4 rounded-3xl bg-po-surface-muted/55 p-4 ring-1 ring-po-border/70">
            <div className="overflow-hidden rounded-[24px] bg-white p-3 ring-1 ring-po-border/80">
              <div className="grid aspect-square place-items-center overflow-hidden rounded-[20px] bg-po-primary-soft text-po-primary">
                {clinicLogo ? (
                  <img
                    src={clinicLogo}
                    alt={infoForm.clinicName || "Logo clinic"}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-10" />
                )}
              </div>
            </div>
            <ImageUploadField
              label="Logo clinic"
              value={infoForm.logoUrl}
              imageType="clinic_logo"
              resourceId={clinicId}
              buttonOnly
              buttonLabel={clinicLogo ? "Đổi logo" : "Tải logo"}
              showHelpText={false}
              buttonClassName="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:bg-po-surface-muted disabled:opacity-60 active:translate-y-0"
              onChange={(url) =>
                setInfoForm((current) => ({
                  ...current,
                  logoUrl: url,
                  logoCloudinaryPublicId: url ? current.logoCloudinaryPublicId : "",
                }))
              }
              onUploadComplete={(result) =>
                setInfoForm((current) => ({
                  ...current,
                  logoCloudinaryPublicId: result.publicId,
                }))
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="Tên clinic" value={infoForm.clinicName} onChange={(value) => setInfoForm({ ...infoForm, clinicName: value })} />
            <Input label="Số điện thoại" icon={Phone} value={infoForm.phone} onChange={(value) => setInfoForm({ ...infoForm, phone: value })} />
            <Input label="Email" icon={Mail} value={infoForm.email} onChange={(value) => setInfoForm({ ...infoForm, email: value })} />
            <Input label="Địa chỉ" icon={MapPin} value={infoForm.address} onChange={(value) => setInfoForm({ ...infoForm, address: value })} />
            <Textarea label="Mô tả" value={infoForm.description} onChange={(value) => setInfoForm({ ...infoForm, description: value })} />
            <OpeningHoursSelect
              value={infoForm.openingHours}
              onChange={(value) => setInfoForm({ ...infoForm, openingHours: value })}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-po-border/80 pt-5">
          <button
            onClick={() => infoMutation.mutate()}
            disabled={!canSaveInfo || infoMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-sm shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:opacity-60 active:translate-y-0"
          >
            <Save className="size-4" />
            {infoMutation.isPending ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Khu vực và lịch đặt hẹn"
        subtitle="Tọa độ giúp owner tìm phòng khám gần họ. Khoảng nghỉ giúp hạn chế các lịch bị đặt sát nhau."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Vĩ độ" value={locationForm.latitude} onChange={(value) => setLocationForm({ ...locationForm, latitude: value })} />
          <Input label="Kinh độ" value={locationForm.longitude} onChange={(value) => setLocationForm({ ...locationForm, longitude: value })} />
          <Input label="Khoảng nghỉ giữa lịch (phút)" icon={Clock3} value={locationForm.appointmentBufferMins} onChange={(value) => setLocationForm({ ...locationForm, appointmentBufferMins: value })} />
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-3xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium leading-5 text-po-text-muted">
            Có thể để trống tọa độ nếu chưa cần tìm kiếm theo khoảng cách. Khoảng nghỉ mặc định 15 phút phù hợp cho phần lớn lịch khám.
          </p>
          <button
            onClick={() => locationMutation.mutate()}
            disabled={locationMutation.isPending}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:bg-po-surface-muted disabled:opacity-60 active:translate-y-0"
          >
            <MapPin className="size-4" />
            {locationMutation.isPending ? "Đang lưu..." : "Lưu khu vực"}
          </button>
        </div>
      </DashboardSection>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  icon?: ComponentType<{ className?: string }>
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <span className="relative block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
        ) : null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-11 w-full rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20",
            Icon ? "pl-10" : "",
          )}
        />
      </span>
    </label>
  )
}

function OpeningHoursSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [isCustomMode, setIsCustomMode] = useState(false)
  const isPreset = openingHourOptions.some((option) => option.value === value)
  const selectValue = isCustomMode || !isPreset ? customOpeningHoursValue : value
  const showCustomInput = selectValue === customOpeningHoursValue

  useEffect(() => {
    if (!value) return
    setIsCustomMode(!isPreset)
  }, [isPreset, value])

  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text lg:col-span-2">
      Giờ mở cửa
      <span className="relative block">
        <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
        <select
          value={selectValue}
          onChange={(event) => {
            const nextValue = event.target.value
            const isCustom = nextValue === customOpeningHoursValue
            setIsCustomMode(isCustom)
            onChange(isCustom ? "" : nextValue)
          }}
          className="h-11 w-full appearance-none rounded-2xl border border-po-border bg-white px-10 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
        >
          {openingHourOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value={customOpeningHoursValue}>Khác</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
      </span>

      {showCustomInput ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ví dụ: Thứ 2 - Thứ 7, 07:30 - 19:00"
          className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-subtle focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
        />
      ) : null}
    </label>
  )
}

function Textarea({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  icon?: ComponentType<{ className?: string }>
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text lg:col-span-2">
      {label}
      <span className="relative block">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-3.5 size-4 text-po-text-subtle" />
        ) : null}
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "min-h-28 w-full resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20",
            Icon ? "pl-10" : "",
          )}
        />
      </span>
    </label>
  )
}
