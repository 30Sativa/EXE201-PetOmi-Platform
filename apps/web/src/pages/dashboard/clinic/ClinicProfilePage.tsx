import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ClipboardPlus, MapPin, Save } from "lucide-react"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import ImageUploadField from "@/components/ui/ImageUploadField"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { formatDate } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
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

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Hồ sơ clinic</h2>
          <p className="mt-1 text-sm text-po-text-muted">Cập nhật thông tin owner nhìn thấy khi tìm clinic và đặt lịch.</p>
        </div>
        <div className="rounded-2xl border border-po-border bg-white px-4 py-3 text-sm">
          <p className="font-bold text-po-text">{clinic.clinicName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge variant={clinic.status === "Approved" ? "success" : "warning"} label={clinic.status} />
            <span className="text-xs text-po-text-muted">Tạo {formatDate(clinic.createdAt)}</span>
          </div>
        </div>
      </div>

      <DashboardSection title="Thông tin công khai" subtitle="Tên, logo, mô tả và giờ mở cửa sẽ hiển thị ở booking flow của owner.">
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-po-border bg-white p-4">
            <ImageUploadField
              label="Logo clinic"
              value={infoForm.logoUrl}
              imageType="clinic_logo"
              resourceId={clinicId}
              previewClassName="h-44 w-full rounded-2xl border border-po-border object-cover"
              onChange={(url) => setInfoForm((current) => ({ ...current, logoUrl: url }))}
              onUploadComplete={(result) => setInfoForm((current) => ({ ...current, logoCloudinaryPublicId: result.publicId }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Tên clinic" value={infoForm.clinicName} onChange={(value) => setInfoForm({ ...infoForm, clinicName: value })} />
            <Input label="Số điện thoại" value={infoForm.phone} onChange={(value) => setInfoForm({ ...infoForm, phone: value })} />
            <Input label="Email" value={infoForm.email} onChange={(value) => setInfoForm({ ...infoForm, email: value })} />
            <Input label="Địa chỉ" value={infoForm.address} onChange={(value) => setInfoForm({ ...infoForm, address: value })} />
            <Textarea label="Mô tả" value={infoForm.description} onChange={(value) => setInfoForm({ ...infoForm, description: value })} />
            <Textarea label="Giờ mở cửa" value={infoForm.openingHours} onChange={(value) => setInfoForm({ ...infoForm, openingHours: value })} />
          </div>
        </div>
        <button
          onClick={() => infoMutation.mutate()}
          disabled={!canSaveInfo || infoMutation.isPending}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
        >
          <Save className="size-4" />
          {infoMutation.isPending ? "Đang lưu..." : "Lưu hồ sơ"}
        </button>
      </DashboardSection>

      <DashboardSection title="Khu vực và lịch đặt hẹn" subtitle="Tọa độ giúp owner tìm phòng khám gần họ. Khoảng nghỉ giúp hạn chế các lịch bị đặt sát nhau.">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Vĩ độ" value={locationForm.latitude} onChange={(value) => setLocationForm({ ...locationForm, latitude: value })} />
          <Input label="Kinh độ" value={locationForm.longitude} onChange={(value) => setLocationForm({ ...locationForm, longitude: value })} />
          <Input label="Khoảng nghỉ giữa lịch (phút)" value={locationForm.appointmentBufferMins} onChange={(value) => setLocationForm({ ...locationForm, appointmentBufferMins: value })} />
        </div>
        <p className="mt-3 rounded-2xl bg-po-surface-muted px-4 py-3 text-xs font-medium leading-5 text-po-text-muted">
          Có thể để trống tọa độ nếu chưa cần tìm kiếm theo khoảng cách. Khoảng nghỉ mặc định 15 phút phù hợp cho phần lớn lịch khám.
        </p>
        <button
          onClick={() => locationMutation.mutate()}
          disabled={locationMutation.isPending}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:bg-po-surface-muted disabled:opacity-60"
        >
          <MapPin className="size-4" />
          {locationMutation.isPending ? "Đang lưu..." : "Lưu khu vực đặt lịch"}
        </button>
      </DashboardSection>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text md:col-span-2">
      {label}
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}
