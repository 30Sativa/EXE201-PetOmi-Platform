import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DashboardSection from "@/components/dashboard/DashboardSection"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import Avatar from "@/components/ui/Avatar"
import ImageUploadField from "@/components/ui/ImageUploadField"
import { getProfileApi, updateProfileApi } from "@/services/profile.service"
import { OwnerProfileSchema, type OwnerProfileForm } from "@/schemas/dashboard.schema"
import { getErrorMessage } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

export default function OwnerProfilePage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfileApi,
  })

  useEffect(() => {
    if (profile?.avatarUrl) {
      setAvatarUrl(profile.avatarUrl)
    }
  }, [profile?.avatarUrl])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
      setErrorMessage("")
      queryClient.invalidateQueries({ queryKey: ["profile"] })
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
        avatarUrl: avatarUrl || undefined,
      })
    } catch {
      setStatus("error")
      setErrorMessage("Đã xảy ra lỗi. Vui lòng thử lại.")
    }
  }

  const isSaving = isSubmitting || updateMutation.isPending || isAvatarUploading

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

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Avatar */}
        <DashboardSection
          title="Ảnh đại diện"
          subtitle="Ảnh này sẽ hiển thị trên hồ sơ và các hoạt động của bạn."
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <Avatar
              src={avatarUrl || profile?.avatarUrl}
              alt={profile?.fullName ?? "User"}
              size="xl"
              className="size-24 border-4 border-white shadow-sm"
            />
            <ImageUploadField
              value={avatarUrl}
              onChange={setAvatarUrl}
              imageType="user_avatar"
              disabled={isSaving}
              onUploadStateChange={setIsAvatarUploading}
              buttonOnly
              buttonClassName="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            />
            <p className="text-xs text-po-text-subtle">
              Nên dùng ảnh vuông, rõ mặt hoặc logo cá nhân.
            </p>
          </div>
        </DashboardSection>

        {/* Profile Form */}
        <DashboardSection
          title="Thông tin cá nhân"
          subtitle="Thông tin liên hệ được dùng khi đặt lịch và nhận hỗ trợ."
        >
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
              disabled={isSaving}
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
      </div>

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
