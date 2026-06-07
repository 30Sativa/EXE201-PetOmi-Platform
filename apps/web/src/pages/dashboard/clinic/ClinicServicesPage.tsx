import { useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Clock, Pencil, Plus, ReceiptText, Trash2, Wrench, type LucideIcon } from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/ui/ConfirmDialog"
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

const compactNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value)

const formatCompactCurrency = (value?: number | null) => {
  const amount = value ?? 0
  const absolute = Math.abs(amount)

  if (absolute >= 1_000_000_000) return `${compactNumber(amount / 1_000_000_000)} tỷ`
  if (absolute >= 1_000_000) return `${compactNumber(amount / 1_000_000)} triệu`
  if (absolute >= 100_000) return `${compactNumber(amount / 1_000)} nghìn`

  return formatCurrency(amount)
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
  const [deleteTarget, setDeleteTarget] = useState<ClinicServiceResponse | null>(null)
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
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "public"] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể xóa dịch vụ.")),
  })

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={Wrench} title="Chưa có phòng khám" description="Bạn cần có hồ sơ phòng khám trước khi quản lý dịch vụ." />
  }

  const services = profileQuery.data?.services ?? []
  const activeServices = services.filter((service) => service.isActive)
  const averageDuration = services.length
    ? Math.round(services.reduce((sum, service) => sum + service.durationMins, 0) / services.length)
    : 0
  const canSubmit = form.serviceName.trim() && Number(form.price) >= 0 && Number(form.durationMins) > 0

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[26px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              Dịch vụ clinic
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight text-po-text">
              Dịch vụ và bảng giá
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-po-text-muted">
              Dịch vụ là nguồn cho booking slot và auto-compose hóa đơn, nên danh sách cần dễ quét hơn form nhập mới.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[390px]">
            <MetricCard label="Đang bán" value={`${activeServices.length}/${services.length}`} icon={ReceiptText} tone="success" />
            <MetricCard label="Thời lượng TB" value={`${averageDuration} phút`} icon={Clock} tone="info" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:h-[calc(100dvh-206px)] xl:min-h-[560px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-h-0 overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-po-border/80 px-4 py-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">Danh sách dịch vụ</h3>
              <p className="mt-1 text-xs text-po-text-muted">{services.length} dịch vụ trong bảng giá hiện tại.</p>
            </div>
            {editing ? (
              <p className="rounded-full bg-po-primary-soft px-3 py-1 text-xs font-bold text-po-primary">
                Đang sửa {editing.serviceName}
              </p>
            ) : null}
          </div>

          <div className="min-h-0 overflow-y-auto p-4">
            {profileQuery.isLoading ? (
              <ServiceSkeleton />
            ) : services.length === 0 ? (
              <EmptyState icon={Wrench} title="Chưa có dịch vụ" description="Thêm dịch vụ để chủ nuôi có thể chọn khi đặt lịch." className="py-14" />
            ) : (
              <div className="grid gap-3">
                {services.map((service) => (
                  <ServiceRow
                    key={service.serviceId}
                    service={service}
                    isEditing={editing?.serviceId === service.serviceId}
                    isDeleting={deleteMutation.isPending}
                    onEdit={() => {
                      setEditing(service)
                      setForm(toForm(service))
                    }}
                    onDelete={() => setDeleteTarget(service)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-[26px] bg-white/90 p-4 ring-1 ring-po-border/80 xl:self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">
                {editing ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}
              </h3>
              <p className="mt-1 text-xs text-po-text-muted">Giá và thời lượng sẽ dùng cho booking và hóa đơn.</p>
            </div>
            <span className="grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
              {editing ? <Pencil className="size-5" /> : <Plus className="size-5" />}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <Input label="Tên dịch vụ" value={form.serviceName} onChange={(value) => setForm({ ...form, serviceName: value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Giá" value={form.price} onChange={(value) => setForm({ ...form, price: value })} />
              <Input label="Thời lượng" value={form.durationMins} onChange={(value) => setForm({ ...form, durationMins: value })} suffix="phút" />
            </div>
            <Input label="Mô tả" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!canSubmit || saveMutation.isPending}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:opacity-60 active:translate-y-0"
            >
              <Plus className="size-4" />
              {saveMutation.isPending ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm dịch vụ"}
            </button>
            {editing ? (
              <button onClick={resetForm} className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:bg-po-surface-muted">
                Hủy
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.serviceId)
        }}
        title="Xóa dịch vụ"
        description={`Bạn có chắc muốn xóa dịch vụ ${deleteTarget?.serviceName ?? ""}? Dịch vụ này sẽ không còn dùng cho booking và hóa đơn mới.`}
        confirmLabel="Xóa dịch vụ"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
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
  tone: "success" | "info"
}) {
  const toneClass = {
    success: "bg-po-success-soft text-po-success",
    info: "bg-po-primary-soft text-po-primary",
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

function ServiceRow({
  service,
  isEditing,
  isDeleting,
  onEdit,
  onDelete,
}: {
  service: ClinicServiceResponse
  isEditing: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article className={`grid gap-4 rounded-[22px] p-3 ring-1 transition lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center ${
      isEditing
        ? "bg-po-primary-soft/55 ring-po-primary/30"
        : "bg-po-surface-muted/45 ring-po-border/70 hover:bg-white hover:shadow-sm hover:shadow-orange-100/70"
    }`}>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h4 className="truncate text-sm font-extrabold text-po-text">{service.serviceName}</h4>
          <StatusBadge variant={service.isActive ? "success" : "default"} label={service.isActive ? "Đang hoạt động" : "Đã ẩn"} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs font-medium text-po-text-muted">{service.description ?? "Không có mô tả"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-po-text-muted ring-1 ring-po-border/70">
            {service.durationMins} phút
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-po-primary ring-1 ring-po-border/70" title={formatCurrency(service.price)}>
            {formatCompactCurrency(service.price)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button
          onClick={onEdit}
          className="inline-flex h-9 items-center rounded-full bg-po-primary-soft px-4 text-xs font-bold text-po-primary transition hover:bg-po-primary hover:text-white active:translate-y-px"
        >
          Sửa
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-po-danger-soft px-4 text-xs font-bold text-po-danger transition hover:bg-po-danger hover:text-white disabled:opacity-60 active:translate-y-px"
        >
          <Trash2 className="size-3.5" />
          Xóa
        </button>
      </div>
    </article>
  )
}

function ServiceSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid gap-4 rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid gap-2">
            <div className="h-4 w-40 animate-pulse rounded-full bg-white" />
            <div className="h-3 w-64 animate-pulse rounded-full bg-white" />
            <div className="h-7 w-48 animate-pulse rounded-full bg-white" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-full bg-white lg:justify-self-end" />
        </div>
      ))}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: ReactNode
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-bold text-po-text">
      {label}
      <span className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-10 w-full rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20 ${suffix ? "pr-12" : ""}`}
        />
        {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-po-text-subtle">{suffix}</span> : null}
      </span>
    </label>
  )
}
