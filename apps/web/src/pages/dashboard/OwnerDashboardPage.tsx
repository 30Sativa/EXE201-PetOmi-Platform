import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarCheck, ClipboardList, PawPrint, Star, UserRound } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatCard from "@/components/dashboard/StatCard"
import { OwnerProfileSchema, type OwnerProfileForm } from "@/schemas/dashboard.schema"

const stats = [
  { label: "Pets đang quản lý", value: "4", icon: PawPrint, hint: "2 đã tiêm phòng" },
  { label: "Lịch hẹn sắp tới", value: "2", icon: CalendarCheck, hint: "Trong 7 ngày" },
  { label: "Lịch sử khám", value: "18", icon: ClipboardList, hint: "Từ 2024" },
  { label: "Đánh giá clinic", value: "4.8", icon: Star, hint: "Trung bình" },
]

const pets = [
  { name: "Mochi", type: "Poodle", age: "3 tuổi", status: "Đã tiêm phòng" },
  { name: "Bim", type: "Mèo Anh", age: "1 tuổi", status: "Chờ nhắc tiêm" },
  { name: "Lily", type: "Corgi", age: "5 tuổi", status: "Theo dõi dinh dưỡng" },
]

const upcomingAppointments = [
  { clinic: "PetOmi Clinic Q2", time: "Thứ Sáu, 09:30", pet: "Mochi" },
  { clinic: "Happy Vet", time: "Chủ Nhật, 14:00", pet: "Bim" },
]

const visitHistory = [
  { clinic: "PetOmi Clinic Q2", diagnosis: "Viêm da nhẹ", date: "02/05/2026" },
  { clinic: "Happy Vet", diagnosis: "Tiêm phòng định kỳ", date: "12/03/2026" },
  { clinic: "Sunrise Vet", diagnosis: "Kiểm tra tổng quát", date: "28/02/2026" },
]

const reviews = [
  { clinic: "PetOmi Clinic Q2", rating: "5.0", note: "Bác sĩ tư vấn kỹ, quy trình nhanh." },
  { clinic: "Happy Vet", rating: "4.7", note: "Nhắc lịch tốt, khu vực chờ sạch sẽ." },
]

export default function OwnerDashboardPage() {
  const [status, setStatus] = useState<"idle" | "success">("idle")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OwnerProfileForm>({
    resolver: zodResolver(OwnerProfileSchema),
    defaultValues: {
      fullName: "Nguyen Minh Anh",
      email: "owner@petomi.vn",
      phone: "0909 123 456",
      city: "Ho Chi Minh",
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

      <DashboardSection title="Hồ sơ chủ nuôi" subtitle="Cập nhật thông tin liên hệ và quyền truy cập." action={<UserRound className="size-5 text-po-primary" />}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="owner-name">
              Họ và tên
            </label>
            <input
              id="owner-name"
              className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm"
              {...register("fullName")}
            />
            {errors.fullName?.message ? <p className="text-xs text-po-danger">{errors.fullName.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="owner-email">
              Email
            </label>
            <input
              id="owner-email"
              className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm"
              {...register("email")}
            />
            {errors.email?.message ? <p className="text-xs text-po-danger">{errors.email.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="owner-phone">
              Số điện thoại
            </label>
            <input
              id="owner-phone"
              className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm"
              {...register("phone")}
            />
            {errors.phone?.message ? <p className="text-xs text-po-danger">{errors.phone.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-po-text" htmlFor="owner-city">
              Thành phố
            </label>
            <input
              id="owner-city"
              className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm"
              {...register("city")}
            />
            {errors.city?.message ? <p className="text-xs text-po-danger">{errors.city.message}</p> : null}
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            {status === "success" ? <span className="text-sm font-semibold text-po-success">Đã cập nhật hồ sơ.</span> : null}
          </div>
        </form>
      </DashboardSection>

      <DashboardSection title="Pets" subtitle="Quản lý hồ sơ sức khỏe và lịch tiêm phòng.">
        <div className="grid gap-3 md:grid-cols-3">
          {pets.map((pet) => (
            <div key={pet.name} className="rounded-2xl border border-po-border bg-po-surface-muted p-4">
              <p className="text-sm font-semibold text-po-text">{pet.name}</p>
              <p className="text-xs text-po-text-muted">{pet.type}</p>
              <p className="mt-2 text-xs text-po-text-subtle">{pet.age}</p>
              <p className="mt-3 text-xs font-semibold text-po-primary">{pet.status}</p>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Lịch hẹn sắp tới" subtitle="Theo dõi lịch khám và nhắc lịch tiêm phòng.">
        <div className="grid gap-3">
          {upcomingAppointments.map((item) => (
            <div key={`${item.clinic}-${item.time}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-po-text">{item.clinic}</p>
                <p className="text-xs text-po-text-muted">{item.pet}</p>
              </div>
              <span className="text-xs font-semibold text-po-text-subtle">{item.time}</span>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Lịch sử khám" subtitle="Tổng hợp các lần khám gần đây.">
        <div className="grid gap-3">
          {visitHistory.map((item) => (
            <div key={`${item.clinic}-${item.date}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-po-text">{item.clinic}</p>
                <p className="text-xs text-po-text-muted">{item.diagnosis}</p>
              </div>
              <span className="text-xs text-po-text-subtle">{item.date}</span>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Đánh giá clinic" subtitle="Phản hồi để cải thiện chất lượng dịch vụ.">
        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((item) => (
            <div key={item.clinic} className="rounded-2xl border border-po-border bg-po-surface-muted p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-po-text">{item.clinic}</p>
                <span className="text-xs font-semibold text-po-primary">{item.rating}</span>
              </div>
              <p className="mt-2 text-xs text-po-text-muted">{item.note}</p>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  )
}
