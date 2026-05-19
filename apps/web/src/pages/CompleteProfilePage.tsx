import { useNavigate } from "react-router-dom"

import { useCompleteProfileForm } from "@/hooks"

export default function CompleteProfilePage() {
  const { register, handleSubmit, errors, isSubmitting, status, message, onSubmit } = useCompleteProfileForm()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-extrabold text-po-text">Hoàn thiện hồ sơ</h1>
          <p className="text-sm text-po-text-subtle">
            Vui lòng điền thông tin cá nhân để hoàn tất đăng ký.
          </p>
        </div>

        <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <label htmlFor="fullName" className="text-sm font-extrabold text-po-text">
              Họ tên <span className="text-po-danger">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
              {...register("fullName")}
            />
            {errors.fullName?.message && (
              <p className="text-sm font-semibold text-po-danger">{errors.fullName.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="phone" className="text-sm font-extrabold text-po-text">
              Số điện thoại <span className="text-po-danger">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="0912345678"
              className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
              {...register("phone")}
            />
            {errors.phone?.message && (
              <p className="text-sm font-semibold text-po-danger">{errors.phone.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="gender" className="text-sm font-extrabold text-po-text">
              Giới tính <span className="text-po-danger">*</span>
            </label>
            <select
              id="gender"
              className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
              {...register("gender")}
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
            {errors.gender?.message && (
              <p className="text-sm font-semibold text-po-danger">{errors.gender.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="dateOfBirth" className="text-sm font-extrabold text-po-text">
              Ngày sinh
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
              {...register("dateOfBirth")}
            />
            {errors.dateOfBirth?.message && (
              <p className="text-sm font-semibold text-po-danger">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="address" className="text-sm font-extrabold text-po-text">
              Địa chỉ
            </label>
            <input
              id="address"
              type="text"
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
              className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
              {...register("address")}
            />
            {errors.address?.message && (
              <p className="text-sm font-semibold text-po-danger">{errors.address.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="avatarUrl" className="text-sm font-extrabold text-po-text">
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
              {...register("avatarUrl")}
            />
            {errors.avatarUrl?.message && (
              <p className="text-sm font-semibold text-po-danger">{errors.avatarUrl.message}</p>
            )}
            <p className="text-xs text-po-text-subtle">
              Nhập link ảnh đại diện (sẽ hỗ trợ upload sau).
            </p>
          </div>

          {message && (
            <p
              className={`rounded-lg px-3 py-2 text-sm font-bold ${
                status === "success"
                  ? "bg-po-success-soft text-po-success"
                  : "bg-po-danger-soft text-po-danger"
              }`}
            >
              {message}
            </p>
          )}

          <button
            className="h-12 w-full rounded-lg bg-po-primary text-[15px] font-extrabold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Hoàn tất hồ sơ"}
          </button>
        </form>
      </div>
    </div>
  )
}
