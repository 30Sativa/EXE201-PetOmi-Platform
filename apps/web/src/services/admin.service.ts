import { api } from "@/lib/axios"
import type {
  AdminAlertsResponse,
  AdminDashboardResponse,
  AdminUserListResponse,
  AuditLogItemResponse,
  ClinicListItemResponse,
  PagedData,
  SystemSettingResponse,
} from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any
  if ("data" in data && data.data != null) {
    return data.data
  }
  return data
}

// --- Dashboard ---
export const getAdminDashboardApi = async (): Promise<AdminDashboardResponse> => {
  const response = await api.get("/admin/dashboard")
  return unwrapResponse<AdminDashboardResponse>(response)
}

// --- Clinics ---
export const getAdminClinicsApi = async (params?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<PagedData<ClinicListItemResponse>> => {
  const response = await api.get("/admin/clinics", {
    params: {
      status: params?.status ?? "Pending",
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  })
  return unwrapResponse<PagedData<ClinicListItemResponse>>(response)
}

// --- Users ---
export const getAdminUsersApi = async (params?: {
  search?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}): Promise<PagedData<AdminUserListResponse>> => {
  const response = await api.get("/admin/users", {
    params: {
      search: params?.search || undefined,
      isActive: params?.isActive ?? undefined,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  })
  return unwrapResponse<PagedData<AdminUserListResponse>>(response)
}

export const toggleUserStatusApi = async (
  userId: string,
  isActive: boolean,
): Promise<AdminUserListResponse> => {
  const response = await api.post(`/admin/users/${userId}/toggle-status`, {
    isActive,
  })
  return unwrapResponse<AdminUserListResponse>(response)
}

export const assignAdminRoleApi = async (
  userId: string,
): Promise<AdminUserListResponse> => {
  const response = await api.post(`/admin/users/${userId}/assign-admin`)
  return unwrapResponse<AdminUserListResponse>(response)
}

export const revokeAdminRoleApi = async (
  userId: string,
): Promise<AdminUserListResponse> => {
  const response = await api.post(`/admin/users/${userId}/revoke-admin`)
  return unwrapResponse<AdminUserListResponse>(response)
}

// --- Clinic Review ---
export const approveClinicApi = async (
  clinicId: string,
): Promise<import("@/types").ReviewClinicResponse> => {
  const response = await api.post(`/admin/clinics/${clinicId}/approve`)
  return unwrapResponse<import("@/types").ReviewClinicResponse>(response)
}

export const rejectClinicApi = async (
  clinicId: string,
  reason: string,
): Promise<import("@/types").ReviewClinicResponse> => {
  const response = await api.post(`/admin/clinics/${clinicId}/reject`, { reason })
  return unwrapResponse<import("@/types").ReviewClinicResponse>(response)
}

// --- Audit Logs ---
export const getAuditLogsApi = async (params?: {
  category?: string
  action?: string
  userId?: string
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
}): Promise<PagedData<AuditLogItemResponse>> => {
  const response = await api.get("/admin/audit-logs", {
    params: {
      category: params?.category || undefined,
      action: params?.action || undefined,
      userId: params?.userId || undefined,
      fromDate: params?.fromDate || undefined,
      toDate: params?.toDate || undefined,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
  })
  return unwrapResponse<PagedData<AuditLogItemResponse>>(response)
}

// --- System Settings ---
export const getSystemSettingsApi = async (): Promise<SystemSettingResponse[]> => {
  const response = await api.get("/admin/settings")
  return unwrapResponse<SystemSettingResponse[]>(response)
}

export const updateSystemSettingApi = async (
  key: string,
  value: string,
): Promise<SystemSettingResponse> => {
  const response = await api.put(`/admin/settings/${encodeURIComponent(key)}`, { value })
  return unwrapResponse<SystemSettingResponse>(response)
}

// --- Alerts ---
export const getAdminAlertsApi = async (params?: {
  maxItems?: number
}): Promise<AdminAlertsResponse> => {
  const response = await api.get("/admin/alerts", {
    params: {
      maxItems: params?.maxItems ?? 50,
    },
  })
  return unwrapResponse<AdminAlertsResponse>(response)
}
