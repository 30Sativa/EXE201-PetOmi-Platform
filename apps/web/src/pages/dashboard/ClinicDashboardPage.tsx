import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock, ClipboardPlus, Stethoscope, UsersRound, Wrench } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatCard from "@/components/dashboard/StatCard"
import { ClinicProfileSchema, type ClinicProfileForm } from "@/schemas/dashboard.schema"

const stats = [
  { label: "Lịch hẹn hôm nay", value: "24", icon: CalendarClock, hint: "6 ca gấp" },
  { label: "Bác sĩ", value: "12", icon: Stethoscope, hint: "3 trực" },
  { label: "Bệnh nhân", value: "68", icon: UsersRound, hint: "Trong tuần" },
  { label: "Dịch vụ", value: "15", icon: Wrench, hint: "Đang hoạt động" },
]

const vets = [
  { name: "Dr. Hieu Tran", role: "Nội tổng quát", status: "Đang trực" },
  { name: "Dr. Mai Nguyen", role: "Siêu âm", status: "Đang khám" },
  { name: "Dr. Lan Pham", role: "Tiêm phòng", status: "Sẵn sàng" },
]

const appointments = [
  { owner: "Nguyen Minh Anh", pet: "Mochi", time: "09:30", type: "Khám tổng quát" },
  { owner: "Tran Gia", pet: "Bim", time: "10:15", type: "Tiêm phòng" },
  { owner: "Le Thao", pet: "Nala", time: "11:00", type: "Khám da liễu" },
]

const patients = [
  { name: "Mochi", owner: "Nguyen Minh Anh", status: "Đã check-in" },
  { name: "Bim", owner: "Tran Gia", status: "Chờ khám" },
  { name: "Nala", owner: "Le Thao", status: "Đang khám" },
]

const services = [
  { name: "Khám tổng quát", price: "350k" },
  { name: "Tiêm phòng", price: "280k" },
  { name: "Xét nghiệm máu", price: "650k" },
  { name: "Siêu âm", price: "750k" },
]

export default function ClinicDashboardPage() {
  const [status, setStatus] = useState<"idle" | "success">("idle")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClinicProfileForm>({
    resolver: zodResolver(ClinicProfileSchema),
    defaultValues: {
      clinicName: "PetOmi Clinic District 2",
      licenseId: "CLN-2026-0215",
      address: "12 Nguyen Van Huong, Q2, HCM",
      phone: "028 3888 9999",
      specialty: "Nội tổng quát, tiêm phòng",
    },
  })

  const onSubmit = async () => {
    setStatus("idle")
    await new Promise((resolve) => setTimeout(resolve, 600))
    setStatus("success")
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <DashboardSection title="Thông tin clinic" subtitle="Quản lý thông tin và trạng thái hoạt động.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="clinic-name">
              Tên clinic
            </label>
            <input id="clinic-name" className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm" {...register("clinicName")} />
            {errors.clinicName?.message ? <p className="text-xs text-po-danger">{errors.clinicName.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="clinic-license">
              Giấy phép
            </label>
            <input id="clinic-license" className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm" {...register("licenseId")} />
            {errors.licenseId?.message ? <p className="text-xs text-po-danger">{errors.licenseId.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="clinic-address">
              Địa chỉ
            </label>
            <input id="clinic-address" className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm" {...register("address")} />
            {errors.address?.message ? <p className="text-xs text-po-danger">{errors.address.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="clinic-phone">
              Số điện thoại
            </label>
            <input id="clinic-phone" className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm" {...register("phone")} />
            {errors.phone?.message ? <p className="text-xs text-po-danger">{errors.phone.message}</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="clinic-specialty">
              Chuyên khoa
            </label>
            <input id="clinic-specialty" className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm" {...register("specialty")} />
            {errors.specialty?.message ? <p className="text-xs text-po-danger">{errors.specialty.message}</p> : null}
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              {isSubmitting ? "Đang lưu..." : "Cập nhật clinic"}
            </button>
            {status === "success" ? <span className="text-sm font-semibold text-po-success">Đã lưu thông tin.</span> : null}
          </div>
        </form>
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Bác sĩ" subtitle="Danh sách bác sĩ và trạng thái trực.">
          <div className="grid gap-3">
            {vets.map((vet) => (
              <div key={vet.name} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-po-text">{vet.name}</p>
                  <p className="text-xs text-po-text-muted">{vet.role}</p>
                </div>
                <span className="text-xs font-semibold text-po-primary">{vet.status}</span>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Lịch hẹn" subtitle="Các ca khám đang chờ xử lý.">
          <div className="grid gap-3">
            {appointments.map((item) => (
              <div key={`${item.owner}-${item.time}`} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-po-text">{item.owner}</p>
                  <p className="text-xs text-po-text-muted">{item.pet} • {item.type}</p>
                </div>
                <span className="text-xs font-semibold text-po-text-subtle">{item.time}</span>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Hồ sơ bệnh nhân" subtitle="Pets đang được theo dõi tại clinic.">
          <div className="grid gap-3">
            {patients.map((patient) => (
              <div key={patient.name} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-po-text">{patient.name}</p>
                  <p className="text-xs text-po-text-muted">Owner: {patient.owner}</p>
                </div>
                <span className="text-xs font-semibold text-po-primary">{patient.status}</span>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Dịch vụ" subtitle="Danh sách dịch vụ và bảng giá.">
          <div className="grid gap-3">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <ClipboardPlus className="size-4 text-po-primary" />
                  <span className="text-sm font-semibold text-po-text">{service.name}</span>
                </div>
                <span className="text-xs font-semibold text-po-text-subtle">{service.price}</span>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>
    </div>
  )
}
