import { api } from "@/lib/axios"
import type {
  AddClinicServiceRequest,
  AddInventoryItemRequest,
  AssignStaffRequest,
  ClinicSearchResult,
  ClinicDoctorListItemResponse,
  ClinicLocationResponse,
  ClinicPublicResponse,
  ClinicServiceResponse,
  ClinicSePayAccountResponse,
  CreateClinicRequest,
  CreateClinicResponse,
  CreateVetProfileRequest,
  CreateVetProfileResponse,
  DeactivateClinicStaffRequest,
  DoctorScheduleResponse,
  InventoryItemResponse,
  MyClinicResponse,
  SetDoctorScheduleRequest,
  StockAdjustRequest,
  UpdateClinicInfoRequest,
  UpdateClinicLocationRequest,
  UpdateClinicServiceRequest,
  UpdateClinicStaffRoleRequest,
  UpsertClinicSePayAccountRequest,
} from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  const data = response.data as T | { data: T }
  if (data && typeof data === "object" && "data" in data) {
    return data.data
  }
  return data as T
}

export const getMyClinicApi = async (): Promise<MyClinicResponse | null> => {
  const response = await api.get("/clinic/my-clinic")
  return unwrapResponse<MyClinicResponse | null>(response)
}

export const searchClinicsApi = async (params?: {
  city?: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<{ items: ClinicSearchResult[]; meta: { page: number; pageSize: number; totalCount: number } }> => {
  const response = await api.get("/public/clinics", { params })
  return unwrapResponse<{ items: ClinicSearchResult[]; meta: { page: number; pageSize: number; totalCount: number } }>(response)
}

export const createVetProfileApi = async (
  data: CreateVetProfileRequest,
): Promise<CreateVetProfileResponse> => {
  const response = await api.post("/vet/profile", data)
  return unwrapResponse<CreateVetProfileResponse>(response)
}

export const createClinicApi = async (
  data: CreateClinicRequest,
): Promise<CreateClinicResponse> => {
  const response = await api.post("/clinic", data)
  return unwrapResponse<CreateClinicResponse>(response)
}

export const updateClinicInfoApi = async (
  clinicId: string,
  data: UpdateClinicInfoRequest,
): Promise<MyClinicResponse> => {
  const response = await api.put(`/clinic/${clinicId}/info`, data)
  return unwrapResponse<MyClinicResponse>(response)
}

export const updateClinicLocationApi = async (
  clinicId: string,
  data: UpdateClinicLocationRequest,
): Promise<ClinicLocationResponse> => {
  const response = await api.patch(`/clinic/${clinicId}/location`, data)
  return unwrapResponse<ClinicLocationResponse>(response)
}

export const getClinicPublicApi = async (
  clinicId: string,
): Promise<ClinicPublicResponse> => {
  const response = await api.get(`/clinic/${clinicId}/public`)
  return unwrapResponse<ClinicPublicResponse>(response)
}

export const getClinicDoctorsInternalApi = async (
  clinicId: string,
): Promise<ClinicDoctorListItemResponse[]> => {
  const response = await api.get(`/clinic/${clinicId}/doctors`)
  return unwrapResponse<ClinicDoctorListItemResponse[]>(response)
}

export const assignClinicStaffApi = async (
  clinicId: string,
  data: AssignStaffRequest,
): Promise<void> => {
  await api.post(`/clinic/${clinicId}/staff`, data)
}

export const updateClinicStaffRoleApi = async (
  clinicId: string,
  vetClinicId: string,
  data: UpdateClinicStaffRoleRequest,
): Promise<boolean> => {
  const response = await api.put(`/clinic/${clinicId}/staff/${vetClinicId}/role`, data)
  return unwrapResponse<boolean>(response)
}

export const deactivateClinicStaffApi = async (
  clinicId: string,
  vetClinicId: string,
  data: DeactivateClinicStaffRequest,
): Promise<boolean> => {
  const response = await api.post(`/clinic/${clinicId}/staff/${vetClinicId}/deactivate`, data)
  return unwrapResponse<boolean>(response)
}

export const addClinicServiceApi = async (
  clinicId: string,
  data: AddClinicServiceRequest,
): Promise<ClinicServiceResponse> => {
  const response = await api.post(`/clinic/${clinicId}/services`, data)
  return unwrapResponse<ClinicServiceResponse>(response)
}

export const updateClinicServiceApi = async (
  clinicId: string,
  serviceId: string,
  data: UpdateClinicServiceRequest,
): Promise<ClinicServiceResponse> => {
  const response = await api.put(`/clinic/${clinicId}/services/${serviceId}`, data)
  return unwrapResponse<ClinicServiceResponse>(response)
}

export const deleteClinicServiceApi = async (
  clinicId: string,
  serviceId: string,
): Promise<void> => {
  await api.delete(`/clinic/${clinicId}/services/${serviceId}`)
}

export const getClinicScheduleApi = async (
  clinicId: string,
): Promise<DoctorScheduleResponse[]> => {
  const response = await api.get(`/clinic/${clinicId}/schedule`)
  return unwrapResponse<DoctorScheduleResponse[]>(response)
}

export const setDoctorScheduleApi = async (
  clinicId: string,
  vetClinicId: string,
  data: SetDoctorScheduleRequest,
): Promise<DoctorScheduleResponse> => {
  const response = await api.post(`/clinic/${clinicId}/staff/${vetClinicId}/schedule`, data)
  return unwrapResponse<DoctorScheduleResponse>(response)
}

export const deleteDoctorScheduleApi = async (
  clinicId: string,
  vetClinicId: string,
  scheduleId: string,
): Promise<void> => {
  await api.delete(`/clinic/${clinicId}/staff/${vetClinicId}/schedule/${scheduleId}`)
}

export const getInventoryApi = async (
  clinicId: string,
): Promise<InventoryItemResponse[]> => {
  const response = await api.get(`/clinic/${clinicId}/inventory`)
  return unwrapResponse<InventoryItemResponse[]>(response)
}

export const getLowStockApi = async (
  clinicId: string,
): Promise<InventoryItemResponse[]> => {
  const response = await api.get(`/clinic/${clinicId}/inventory/low-stock`)
  return unwrapResponse<InventoryItemResponse[]>(response)
}

export const addInventoryItemApi = async (
  clinicId: string,
  data: AddInventoryItemRequest,
): Promise<InventoryItemResponse> => {
  const response = await api.post(`/clinic/${clinicId}/inventory`, data)
  return unwrapResponse<InventoryItemResponse>(response)
}

export const stockInApi = async (
  clinicId: string,
  itemId: string,
  data: StockAdjustRequest,
): Promise<InventoryItemResponse> => {
  const response = await api.post(`/clinic/${clinicId}/inventory/${itemId}/stock-in`, data)
  return unwrapResponse<InventoryItemResponse>(response)
}

export const stockOutApi = async (
  clinicId: string,
  itemId: string,
  data: StockAdjustRequest,
): Promise<InventoryItemResponse> => {
  const response = await api.post(`/clinic/${clinicId}/inventory/${itemId}/stock-out`, data)
  return unwrapResponse<InventoryItemResponse>(response)
}

export const deleteInventoryItemApi = async (
  clinicId: string,
  itemId: string,
): Promise<void> => {
  await api.delete(`/clinic/${clinicId}/inventory/${itemId}`)
}

export const getSePayAccountApi = async (
  clinicId: string,
): Promise<ClinicSePayAccountResponse | null> => {
  try {
    const response = await api.get(`/clinic-payments/${clinicId}/sepay-account`)
    return unwrapResponse<ClinicSePayAccountResponse>(response)
  } catch (error) {
    if (typeof error === "object" && error !== null && "response" in error) {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 404) return null
    }
    throw error
  }
}

export const upsertSePayAccountApi = async (
  clinicId: string,
  data: UpsertClinicSePayAccountRequest,
): Promise<ClinicSePayAccountResponse> => {
  const response = await api.put(`/clinic-payments/${clinicId}/sepay-account`, data)
  return unwrapResponse<ClinicSePayAccountResponse>(response)
}
