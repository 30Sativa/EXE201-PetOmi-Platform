import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { useMe } from "@/hooks/useAuthQueries"

interface RequireAuthProps {
  children: React.ReactNode
}

function sanitizeNext(raw: string): string {
  // Chỉ cho phép đường dẫn nội bộ — từ chối external URL và protocol-relative
  if (raw.startsWith("//") || /^https?:\/\//i.test(raw)) return "/dashboard"
  return raw
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const isPasswordSetupRoute = location.pathname === "/set-password"
  const me = useMe(isAuthenticated)

  if (isLoading || (isAuthenticated && !isPasswordSetupRoute && me.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isPasswordSetupRoute && me.data?.hasPassword === false) {
    const next = sanitizeNext(`${location.pathname}${location.search}`)
    return <Navigate to={`/set-password?next=${encodeURIComponent(next)}`} replace />
  }

  return <>{children}</>
}
