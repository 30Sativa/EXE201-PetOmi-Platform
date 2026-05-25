import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Camera } from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import Avatar from "@/components/ui/Avatar"
import { getProfileApi, updateProfileApi } from "@/services/profile.service"
import { OwnerProfileSchema, type OwnerProfileForm } from "@/schemas/dashboard.schema"
import { getErrorMessage } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

export default function OwnerProfilePage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfileApi,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<OwnerProfileForm>({
    resolver: zodResolver(OwnerProfileSchema),
    values: profile
      ? {
          fullName: profile.fullName ?? "",
          email: user?.email ?? "",
          phone: profile.phone ?? "",
          city: profile.address ?? "",
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: () => {
      setStatus("success")
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      reset()
    },
    onError: (err) => {
      setStatus("error")
      setErrorMessage(getErrorMessage(err))
    },
  })

  const onSubmit = async (data: OwnerProfileForm) => {
    setStatus("idle")
    setErrorMessage("")
    try {
      await updateMutation.mutateAsync({
        fullName: data.fullName,
        phone: data.phone,
        address: data.city,
      })
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-po-text">Hồ sơ cá nhân</h2>
        <p className="mt-1 text-sm text-po-text-muted">
          Cập nhật thông tin liên hệ và quyền truy cập.
        </p>
      </div>

      {/* Avatar */}
      <DashboardSection title="Ảnh đại diện">
        <div className="flex items-center gap-4">
          <Avatar
            src={profile?.avatarUrl}
            alt={profile?.fullName ?? "User"}
            size="xl"
          />
          <div>
            <button className="inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text transition hover:bg-po-surface-muted">
              <Camera className="size-4" />
              Đổi ảnh
            </button>
            <p className="mt-2 text-xs text-po-text-subtle">
              JPG, PNG, tối đa 5MB
            </p>
          </div>
        </div>
      </DashboardSection>

      {/* Profile Form */}
      <DashboardSection title="Thông tin cá nhân">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="grid gap-2">
            <label
              className="text-sm font-semibold text-po-text"
              htmlFor="owner-name"
            >
              Họ và tên <span className="text-po-danger">*</span>
            </label>
            <input
              id="owner-name"
              className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
              {...register("fullName")}
            />
            {errors.fullName?.message && (
              <p className="text-xs text-po-danger">{errors.fullName.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label
              className="text-sm font-semibold text-po-text"
              htmlFor="owner-email"
            >
              Email
            </label>
            <input
              id="owner-email"
              type="email"
              value={user?.email ?? ""}
              readOnly
              disabled
              className="h-11 cursor-not-allowed rounded-lg border border-po-border bg-po-surface-muted px-3 text-sm text-po-text-muted"
            />
            <p className="text-xs text-po-text-subtle">
              Email không thể thay đổi
            </p>
          </div>

          <div className="grid gap-2">
            <label
              className="text-sm font-semibold text-po-text"
              htmlFor="owner-phone"
            >
              Số điện thoại <span className="text-po-danger">*</span>
            </label>
            <input
              id="owner-phone"
              type="tel"
              className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
              {...register("phone")}
            />
            {errors.phone?.message && (
              <p className="text-xs text-po-danger">{errors.phone.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label
              className="text-sm font-semibold text-po-text"
              htmlFor="owner-city"
            >
              Địa chỉ
            </label>
            <input
              id="owner-city"
              className="h-11 rounded-lg border border-po-border bg-white px-3 text-sm focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
              {...register("city")}
            />
            {errors.city?.message && (
              <p className="text-xs text-po-danger">{errors.city.message}</p>
            )}
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="inline-flex h-11 items-center rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              {isSubmitting || updateMutation.isPending
                ? "Đang lưu..."
                : "Lưu thay đổi"}
            </button>
            {status === "success" && (
              <span className="text-sm font-semibold text-po-success">
                Đã cập nhật hồ sơ.
              </span>
            )}
            {status === "error" && (
              <span className="text-sm font-semibold text-po-danger">
                {errorMessage || "Đã xảy ra lỗi. Vui lòng thử lại."}
              </span>
            )}
          </div>
        </form>
      </DashboardSection>

      {/* Account Info */}
      <DashboardSection title="Thông tin tài khoản">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-po-border bg-po-surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
              Ngày tham gia
            </p>
            <p className="mt-1 font-semibold text-po-text">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-po-border bg-po-surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-po-text-subtle">
              Ngày sinh
            </p>
            <p className="mt-1 font-semibold text-po-text">
              {profile?.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </DashboardSection>
    </div>
  )
}
