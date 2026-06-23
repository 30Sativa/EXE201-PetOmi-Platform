import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { getDashboardPathForRole, resolvePreferredRole } from "@/lib/authRoles"

export function useGoogleLogin() {
  const navigate = useNavigate()
  const { setAuthFromTokens } = useAuth()
  const popupRef = useRef<Window | null>(null)

  useEffect(() => {
    // Bỏ tiền tố "www." để apex (petomi.cloud) và www (www.petomi.cloud)
    // được coi là cùng origin — tránh popup Google bị drop message khi lệch host.
    const normalizeOrigin = (origin: string) => origin.replace("://www.", "://")

    const handleMessage = (event: MessageEvent) => {
      if (normalizeOrigin(event.origin) !== normalizeOrigin(window.location.origin)) return
      if (event.data?.type !== "GOOGLE_AUTH_SUCCESS") return

      const {
        accessToken,
        refreshToken,
        email,
        userId,
        isProfileCompleted,
        requiresPasswordSetup,
        activeRole,
        roles,
      } = event.data

      if (accessToken && refreshToken) {
        setAuthFromTokens(accessToken, refreshToken, {
          userId,
          email,
          activeRole,
          roles,
        })

        const nextPath = isProfileCompleted
          ? getDashboardPathForRole(resolvePreferredRole(activeRole, roles))
          : "/complete-profile"

        if (requiresPasswordSetup) {
          navigate(`/set-password?next=${encodeURIComponent(nextPath)}`, {
            replace: true,
          })
        } else if (isProfileCompleted) {
          navigate(
            nextPath,
            { replace: true },
          )
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
      requiresPasswordSetup?: boolean
      activeRole?: string
      roles?: string[]
    }) => {
      setAuthFromTokens(
        tokens.accessToken,
        tokens.refreshToken,
        {
          userId: tokens.userId,
          email: tokens.email,
          activeRole: tokens.activeRole,
          roles: tokens.roles,
        },
      )

      const nextPath = tokens.isProfileCompleted
        ? getDashboardPathForRole(
            resolvePreferredRole(tokens.activeRole, tokens.roles),
          )
        : "/complete-profile"

      if (tokens.requiresPasswordSetup) {
        navigate(`/set-password?next=${encodeURIComponent(nextPath)}`, {
          replace: true,
        })
      } else if (tokens.isProfileCompleted) {
        navigate(
          nextPath,
          { replace: true },
        )
      } else {
        navigate("/complete-profile", { replace: true })
      }
    },
    [setAuthFromTokens, navigate],
  )

  return { login, handleCallback }
}
