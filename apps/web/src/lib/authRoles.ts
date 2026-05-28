export const AUTH_ROLES = {
  OWNER: "Owner",
  ADMIN: "Admin",
  VET: "Vet",
} as const

export type AuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES] | string

function normalizeRole(role?: string | null) {
  return (role ?? "").trim().toLowerCase()
}

export function resolvePreferredRole(activeRole?: string | null, roles?: string[]) {
  const roleSet = new Set((roles ?? []).map((r) => normalizeRole(r)))

  if (roleSet.has("admin")) {
    return AUTH_ROLES.ADMIN
  }

  if (roleSet.has("owner")) {
    return AUTH_ROLES.OWNER
  }

  if (roleSet.has("vet")) {
    return AUTH_ROLES.VET
  }

  const normalizedActiveRole = normalizeRole(activeRole)
  if (normalizedActiveRole === "admin") return AUTH_ROLES.ADMIN
  if (normalizedActiveRole === "vet") return AUTH_ROLES.VET
  return AUTH_ROLES.OWNER
}

export function getDashboardPathForRole(activeRole?: string | null) {
  switch (normalizeRole(activeRole)) {
    case "admin":
      return "/dashboard/admin"
    case "vet":
      return "/dashboard/clinic"
    case "owner":
    default:
      return "/dashboard/owner"
  }
}
