import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { useGoogleLogin } from "@/hooks"

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuthFromTokens } = useAuth()
  const { handleCallback } = useGoogleLogin()

  useEffect(() => {
    const accessToken = searchParams.get("accessToken")
    const refreshToken = searchParams.get("refreshToken")
    const email = searchParams.get("email")
    const userId = searchParams.get("userId")
    const activeRole = searchParams.get("activeRole") ?? undefined
    const roles = searchParams.getAll("roles")
    const isProfileCompleted = searchParams.get("isProfileCompleted") === "true"

    if (accessToken && refreshToken) {
      setAuthFromTokens(accessToken, refreshToken, {
        userId: userId ?? undefined,
        email: email ?? undefined,
        activeRole,
        roles,
      })

      handleCallback({
        accessToken,
        refreshToken,
        email: email ?? "",
        userId: userId ?? "",
        isProfileCompleted,
        activeRole,
        roles,
      })
    } else {
      navigate("/login", { replace: true })
    }
  }, [navigate, searchParams, setAuthFromTokens, handleCallback])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-po-border border-t-po-primary" />
        <p className="text-sm text-po-text-muted">Đang đăng nhập với Google...</p>
      </div>
    </div>
  )
}
