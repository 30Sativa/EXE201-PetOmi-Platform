import { Navigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { getDashboardPathForRole, resolvePreferredRole } from "@/lib/authRoles"

export function DashboardRedirect() {
  const { user } = useAuth()
  const preferredRole = resolvePreferredRole(
    user?.activeRole ?? user?.role,
    user?.roles,
  )

  return (
    <Navigate
      to={getDashboardPathForRole(preferredRole)}
      replace
    />
  )
}
