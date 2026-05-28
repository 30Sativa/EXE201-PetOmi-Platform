import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"

export function useGoogleLogin() {
  const navigate = useNavigate()
  const { setAuthFromTokens } = useAuth()
  const popupRef = useRef<Window | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "GOOGLE_AUTH_SUCCESS") return

      const { accessToken, refreshToken, email, userId, isProfileCompleted } = event.data

      if (accessToken && refreshToken) {
        setAuthFromTokens(accessToken, refreshToken, userId, email)

        if (isProfileCompleted) {
          navigate("/dashboard/owner", { replace: true })
        } else {
          navigate("/complete-profile", { replace: true })
        }
      } else {
        navigate("/login", { replace: true })
      }

      popupRef.current?.close()
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [navigate, setAuthFromTokens])

  const login = useCallback(() => {
    const googleAuthUrl = `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5273/api"}/auth/google/login`

    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    popupRef.current = window.open(
      googleAuthUrl,
      "google_login",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    )
  }, [])

  const handleCallback = useCallback(
    (tokens: {
      accessToken: string
      refreshToken: string
      email: string
      userId: string
      isProfileCompleted: boolean
    }) => {
      setAuthFromTokens(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.userId,
        tokens.email,
      )

      if (tokens.isProfileCompleted) {
        navigate("/dashboard/owner", { replace: true })
      } else {
        navigate("/complete-profile", { replace: true })
      }
    },
    [setAuthFromTokens, navigate],
  )

  return { login, handleCallback }
}
