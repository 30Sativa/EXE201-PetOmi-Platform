import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, KeyRound } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import FormStatusMessage from "@/components/ui/FormStatusMessage"
import { setPasswordApi } from "@/services/auth.service"
import { SetPasswordRequestSchema, type SetPasswordRequest } from "@/schemas/auth.schema"
import { getErrorMessage } from "@/lib/utils"

const fieldClass =
  "h-12 w-full rounded-2xl border border-po-border bg-po-surface-muted/55 px-4 text-[15px] text-po-text transition placeholder:text-po-text-subtle focus:border-po-primary focus:bg-white focus:shadow-[var(--po-focus-ring)]"

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/complete-profile"
  }

  return next
}

export default function SetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams],
  )

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordRequest>({
    resolver: zodResolver(SetPasswordRequestSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: SetPasswordRequest) => {
    setMessage("")
    setIsSubmitting(true)

    try {
      await setPasswordApi(data)
      navigate(nextPath, { replace: true })
    } catch (err) {
      setMessage(getErrorMessage(err, "Khong the thiet lap mat khau. Vui long thu lai."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
      <section className="mx-auto grid min-h-screen w-full max-w-[560px] items-center px-3 py-8 sm:px-6">
        <div className="overflow-hidden rounded-[30px] border border-po-border bg-white/[0.92] p-5 shadow-2xl shadow-orange-200/25 md:p-7">
          <div className="mb-7">
            <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
              <KeyRound className="size-7" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
              Google sign-in
            </span>
            <h1 className="mt-2 max-w-full break-words text-3xl font-extrabold leading-tight text-po-text">
              Thiet lap mat khau
            </h1>
            <p className="mt-2 max-w-full break-words text-sm leading-6 text-po-text-muted">
              Tao mat khau de lan sau ban co the dang nhap bang email va mat khau.
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <label htmlFor="set-password" className="text-sm font-semibold text-po-text">
                Mat khau <span className="text-po-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="set-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Toi thieu 6 ky tu"
                  className={`${fieldClass} pr-12`}
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-po-text-muted transition hover:bg-white hover:text-po-text"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "An mat khau" : "Hien mat khau"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.newPassword?.message ? (
                <p className="text-sm font-semibold text-po-danger">
                  {errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="set-confirm-password" className="text-sm font-semibold text-po-text">
                Xac nhan mat khau <span className="text-po-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="set-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhap lai mat khau"
                  className={`${fieldClass} pr-12`}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-po-text-muted transition hover:bg-white hover:text-po-text"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? "An mat khau" : "Hien mat khau"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword?.message ? (
                <p className="text-sm font-semibold text-po-danger">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            {message ? (
              <FormStatusMessage
                status="error"
                title="Chua the thiet lap mat khau"
                message={message}
              />
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-full bg-po-primary text-[15px] font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
            >
              {isSubmitting ? "Dang xu ly..." : "Luu mat khau"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
