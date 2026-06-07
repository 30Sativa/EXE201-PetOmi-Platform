import type { MyClinicResponse } from "@/types"

export const CLINIC_PERMISSIONS = {
  MANAGE_STAFF: "clinic:manage-staff",
  EDIT_INFO: "clinic:edit-info",
  VIEW_REPORTS: "clinic:view-reports",
  MANAGE_APPOINTMENTS: "appointment:manage",
  VIEW_APPOINTMENTS: "appointment:view",
  WRITE_MEDICAL_RECORD: "medical-record:write",
  READ_MEDICAL_RECORD: "medical-record:read",
  CREATE_PRESCRIPTION: "prescription:create",
  CREATE_DIAGNOSIS: "diagnosis:create",
  VIEW_INVENTORY: "inventory:view",
  MANAGE_INVENTORY: "inventory:manage",
  VIEW_INVOICE: "invoice:view",
  MANAGE_INVOICE: "invoice:manage",
  MANAGE_ORDER: "order:manage",
  RECONCILE_PAYMENT: "payment:reconcile",
  CONFIGURE_PAYMENT: "payment:configure",
} as const

export type ClinicPermission =
  (typeof CLINIC_PERMISSIONS)[keyof typeof CLINIC_PERMISSIONS]

export function hasClinicPermission(
  clinic: Pick<MyClinicResponse, "clinicPermissions"> | null | undefined,
  permission: ClinicPermission,
) {
  return Boolean(clinic?.clinicPermissions?.includes(permission))
}

export function hasAnyClinicPermission(
  clinic: Pick<MyClinicResponse, "clinicPermissions"> | null | undefined,
  permissions: ClinicPermission[],
) {
  if (permissions.length === 0) return true
  return permissions.some((permission) => hasClinicPermission(clinic, permission))
}
