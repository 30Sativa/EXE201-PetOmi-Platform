import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { useVerifyEmail } from "@/hooks/useAuthQueries"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token") ?? ""

  const verifyEmail = useVerifyEmail(token)

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    verifyEmail.mutate(undefined, {
      onSuccess: (data) => {
        if (data.isProfileCompleted) {
          navigate("/dashboard")
        } else {
          navigate("/complete-profile")
        }
      },

      onError: () => {
        navigate("/login")
      },
    })
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p>Đang xác minh email...</p>
      </div>
    </div>
  )
}