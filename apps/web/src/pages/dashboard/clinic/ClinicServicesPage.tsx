import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Wrench } from "lucide-react"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { formatCurrency } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import {
  addClinicServiceApi,
  deleteClinicServiceApi,
  getClinicPublicApi,
  updateClinicServiceApi,
} from "@/services/clinic.service"
import type { ClinicServiceResponse } from "@/types"

type ServiceForm = {
  serviceName: string
  description: string
  price: string
  durationMins: string
}

const emptyForm: ServiceForm = {
  serviceName: "",
  description: "",
  price: "",
  durationMins: "30",
}

function toForm(service?: ClinicServiceResponse | null): ServiceForm {
  if (!service) return emptyForm
  return {
    serviceName: service.serviceName,
    description: service.description ?? "",
    price: String(service.price),
    durationMins: String(service.durationMins),
  }
}

export default function ClinicServicesPage() {
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [editing, setEditing] = useState<ClinicServiceResponse | null>(null)
  const [form, setForm] = useState<ServiceForm>(emptyForm)

  const profileQuery = useQuery({
    queryKey: ["clinic", clinicId, "public"],
    queryFn: () => getClinicPublicApi(clinicId),
    enabled: Boolean(clinicId),
  })

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        serviceName: form.serviceName.trim(),
        description: form.description.trim() || null,
        price: Number(form.price) || 0,
        durationMins: Number(form.durationMins) || 30,
      }

      return editing
        ? updateClinicServiceApi(clinicId, editing.serviceId, payload)
        : addClinicServiceApi(clinicId, payload)
    },
    onSuccess: async () => {
      toast.success(editing ? "Đã cập nhật dịch vụ." : "Đã thêm dịch vụ.")
      resetForm()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "public"] }),
        queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "dashboard-summary"] }),
      ])
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể lưu dịch vụ.")),
  })

  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => deleteClinicServiceApi(clinicId, serviceId),
    onSuccess: async () => {
      toast.success("Đã xóa dịch vụ.")
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "public"] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể xóa dịch vụ.")),
  })

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={Wrench} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi quản lý dịch vụ." />
  }

  const services = profileQuery.data?.services ?? []
  const canSubmit = form.serviceName.trim() && Number(form.price) >= 0 && Number(form.durationMins) > 0

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-po-text">Dịch vụ và bảng giá</h2>
        <p className="mt-1 text-sm text-po-text-muted">Quản lý danh mục dịch vụ dùng cho booking và auto-compose hóa đơn.</p>
      </div>

      <DashboardSection title={editing ? "Cập nhật dịch vụ" : "Thêm dịch vụ"} subtitle="Giá và thời lượng sẽ được dùng trong booking slot và hóa đơn.">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tên dịch vụ" value={form.serviceName} onChange={(value) => setForm({ ...form, serviceName: value })} />
          <Input label="Giá" value={form.price} onChange={(value) => setForm({ ...form, price: value })} />
          <Input label="Thời lượng (phút)" value={form.durationMins} onChange={(value) => setForm({ ...form, durationMins: value })} />
          <Input label="Mô tả" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!canSubmit || saveMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            <Plus className="size-4" />
            {saveMutation.isPending ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm dịch vụ"}
          </button>
          {editing ? (
            <button onClick={resetForm} className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:bg-po-surface-muted">
              Hủy sửa
            </button>
          ) : null}
        </div>
      </DashboardSection>

      <DashboardSection title={`${services.length} dịch vụ`} subtitle="Dịch vụ inactive vẫn được ẩn khỏi booking công khai.">
        {profileQuery.isLoading ? (
          <div className="py-12 text-center"><LoadingSpinner /></div>
        ) : services.length === 0 ? (
          <EmptyState icon={Wrench} title="Chưa có dịch vụ" description="Thêm dịch vụ để owner có thể chọn khi đặt lịch." />
        ) : (
          <div className="grid gap-3">
            {services.map((service) => (
              <div key={service.serviceId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-po-border bg-white px-4 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-po-text">{service.serviceName}</p>
                    <StatusBadge variant={service.isActive ? "success" : "default"} label={service.isActive ? "Đang hoạt động" : "Đã ẩn"} />
                  </div>
                  <p className="mt-1 text-xs text-po-text-muted">{service.description ?? "Không có mô tả"}</p>
                  <p className="mt-2 text-xs font-semibold text-po-text-subtle">{service.durationMins} phút · {formatCurrency(service.price)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(service)
                      setForm(toForm(service))
                    }}
                    className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-semibold text-po-primary transition hover:bg-po-primary hover:text-white"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(service.serviceId)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-po-danger-soft px-4 text-xs font-semibold text-po-danger transition hover:bg-po-danger hover:text-white disabled:opacity-60"
                  >
                    <Trash2 className="size-3" />
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

