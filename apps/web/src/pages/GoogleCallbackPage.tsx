import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { useGoogleLogin } from "@/hooks"
import { exchangeAuthCodeApi } from "@/services/auth.service"

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleCallback } = useGoogleLogin()

  useEffect(() => {
    const code = searchParams.get("code")

    // Xoá code khỏi URL ngay lập tức — tránh lưu vào browser history
    window.history.replaceState({}, "", window.location.pathname)

    if (!code) {
      navigate("/login", { replace: true })
      return
    }

    exchangeAuthCodeApi(code)
      .then((result) => {
        const payload = {
          type: "GOOGLE_AUTH_SUCCESS" as const,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          email: result.email,
          userId: result.userId,
          isProfileCompleted: result.isProfileCompleted,
          requiresPasswordSetup: result.requiresPasswordSetup,
          activeRole: result.activeRole,
          roles: result.roles,
        }

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, window.location.origin)
          window.close()
          return
        }

        handleCallback({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          email: result.email,
          userId: result.userId,
          isProfileCompleted: result.isProfileCompleted,
          requiresPasswordSetup: result.requiresPasswordSetup,
          activeRole: result.activeRole,
          roles: result.roles,
        })
      })
      .catch(() => {
        navigate("/login", { replace: true })
      })
  }, [navigate, searchParams, handleCallback])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-po-border border-t-po-primary" />
        <p className="text-sm text-po-text-muted">Đang đăng nhập với Google...</p>
      </div>
    </div>
  )
}
