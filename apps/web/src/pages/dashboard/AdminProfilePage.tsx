import { useEffect, useState } from "react"
import {
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserCircle,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import Avatar from "@/components/ui/Avatar"
import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { useAuth } from "@/contexts/AuthContext"
import { getErrorMessage } from "@/lib/utils"
import { getProfileApi, updateProfileApi } from "@/services/profile.service"

type ProfileFormState = {
  fullName: string
  phone: string
  address: string
  gender: "" | "Male" | "Female" | "Other"
  dateOfBirth: string
}

const emptyForm: ProfileFormState = {
  fullName: "",
  phone: "",
  address: "",
  gender: "",
  dateOfBirth: "",
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Chưa cập nhật"
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function toDateInputValue(dateStr?: string | null) {
  if (!dateStr) return ""
  return dateStr.slice(0, 10)
}

export default function AdminProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProfileFormState>(emptyForm)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfileApi,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (!profile) return
    setForm({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      gender:
        profile.gender === "Male" || profile.gender === "Female" || profile.gender === "Other"
          ? profile.gender
          : "",
      dateOfBirth: toDateInputValue(profile.dateOfBirth),
    })
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: () => {
      setStatus("success")
      setErrorMessage("")
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
    onError: (error) => {
      setStatus("error")
      setErrorMessage(getErrorMessage(error))
    },
  })

  const initials =
    (profile?.fullName?.[0] ?? user?.email?.[0] ?? "A").toUpperCase()

  const handleChange =
    (field: keyof ProfileFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
      setStatus("idle")
      setErrorMessage("")
    }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateMutation.mutate({
      fullName: form.fullName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      gender: form.gender || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-[28px] bg-white py-16 text-center shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[30px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              src={profile?.avatarUrl}
              alt={profile?.fullName ?? user?.email ?? "Admin"}
              fallback={initials}
              size="lg"
              shape="square"
              className="size-16 shrink-0 rounded-[22px] ring-1 ring-po-border/80"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-po-text-subtle">
                Admin profile
              </p>
              <h2 className="mt-1 truncate text-2xl font-extrabold leading-tight text-po-text">
                {profile?.fullName || "Admin PetOmi"}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-po-text-muted">
                Quản lý thông tin liên hệ dùng cho audit, thông báo hệ thống và các thao tác nhạy cảm.
              </p>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl bg-po-surface-muted/70 px-4 py-3 text-sm ring-1 ring-po-border/70 sm:min-w-64">
            <div className="flex flex-wrap items-center gap-1.5">
              {(user?.roles?.length ? user.roles : [user?.activeRole ?? "Admin"]).map((role) => (
                <StatusBadge key={role} variant="info" label={role} />
              ))}
            </div>
            <p className="truncate text-xs font-semibold text-po-text-muted">
              {user?.email ?? "Chưa có email"}
            </p>
            <p className="text-xs font-semibold text-po-text-subtle">
              Tham gia: {formatDate(profile?.createdAt)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <DashboardSection
          title="Thông tin cá nhân"
          subtitle="Các trường này dùng cho hồ sơ admin và log vận hành nội bộ."
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-po-text">
                Họ và tên
                <input
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-subtle focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                  placeholder="Nhập họ và tên"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-po-text">
                Số điện thoại
                <input
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-subtle focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                  placeholder="VD: 0912345678"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-po-text">
                Ngày sinh
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange("dateOfBirth")}
                  className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-po-text">
                Giới tính
                <select
                  value={form.gender}
                  onChange={handleChange("gender")}
                  className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                >
                  <option value="">Chưa cập nhật</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-po-text">
              Địa chỉ
              <input
                value={form.address}
                onChange={handleChange("address")}
                className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-subtle focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                placeholder="Nhập địa chỉ liên hệ"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-lg shadow-orange-200/35 transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:translate-y-0 disabled:opacity-60 max-[420px]:w-full"
              >
                <Save className="size-4" />
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              {status === "success" ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-po-success">
                  <CheckCircle2 className="size-4" />
                  Đã cập nhật hồ sơ.
                </span>
              ) : null}
              {status === "error" ? (
                <span className="text-sm font-semibold text-po-danger">
                  {errorMessage || "Không thể cập nhật hồ sơ. Vui lòng thử lại."}
                </span>
              ) : null}
            </div>
          </form>
        </DashboardSection>

        <div className="grid content-start gap-5">
          <DashboardSection title="Tài khoản" subtitle="Thông tin đọc từ phiên đăng nhập hiện tại.">
            <div className="grid gap-3">
              <InfoRow icon={Mail} label="Email" value={user?.email ?? "Chưa có"} />
              <InfoRow icon={ShieldCheck} label="Vai trò hiện tại" value={user?.activeRole ?? "Admin"} />
              <InfoRow icon={Calendar} label="Ngày tham gia" value={formatDate(profile?.createdAt)} />
              <InfoRow icon={UserCircle} label="Cập nhật gần nhất" value={formatDate(profile?.updatedAt)} />
            </div>
          </DashboardSection>

          <DashboardSection title="Liên hệ nhanh" subtitle="Dữ liệu hồ sơ được đồng bộ với endpoint profile chung.">
            <div className="grid gap-3">
              <InfoRow icon={Phone} label="Điện thoại" value={profile?.phone ?? "Chưa cập nhật"} />
              <InfoRow icon={MapPin} label="Địa chỉ" value={profile?.address ?? "Chưa cập nhật"} />
            </div>
          </DashboardSection>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-po-surface-muted/70 p-3 ring-1 ring-po-border/70">
      <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-po-text-subtle">{label}</p>
        <p className="mt-0.5 break-words text-sm font-bold text-po-text">{value}</p>
      </div>
    </div>
  )
}
