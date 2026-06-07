import { Navigate } from "react-router-dom"

import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { hasAnyClinicPermission, type ClinicPermission } from "@/lib/clinicPermissions"
import { ShieldAlert } from "lucide-react"

interface RequireClinicPermissionProps {
  children: React.ReactNode
  permissions?: ClinicPermission[]
}

export function RequireClinicPermission({
  children,
  permissions = [],
}: RequireClinicPermissionProps) {
  const { data: clinic, isLoading } = useMyClinic()

  if (isLoading) {
    return (
      <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80">
        <LoadingSpinner />
      </div>
    )
  }

  if (!clinic) {
    return <Navigate to="/dashboard/owner/register-clinic" replace />
  }

  if (!hasAnyClinicPermission(clinic, permissions)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Không đủ quyền"
        description="Vai trò clinic hiện tại không được mở khu vực này."
      />
    )
  }

  return <>{children}</>
}
