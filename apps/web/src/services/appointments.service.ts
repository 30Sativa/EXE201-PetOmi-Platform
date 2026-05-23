import { api } from "@/lib/axios"
import type {
  AppointmentListItemResponse,
  AppointmentResponse,
  AvailableSlotResponse,
  BookAppointmentRequest,
  CancelAppointmentRequest,
  RescheduleAppointmentRequest,
} from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any
  if ("data" in data && data.data != null) {
    return data.data
  }
  return data
}

// ==================== OWNER APPOINTMENTS ====================

export const getOwnerAppointmentsApi = async (params?: {
  pageNumber?: number
  pageSize?: number
  status?: string
}): Promise<AppointmentListItemResponse[]> => {
  const response = await api.get("/appointments/owner", { params })
  // Backend returns BaseResponse<PagedData<AppointmentListItemResponse>>
  // with PascalCase Items/Meta from C# JSON serialization
  const paged = unwrapResponse<{ Items?: AppointmentListItemResponse[]; items?: AppointmentListItemResponse[] }>(response)
  const items = paged?.Items ?? paged?.items
  return Array.isArray(items) ? items : []
}

export const getAvailableSlotsApi = async (params: {
  clinicId: string
  date: string
  serviceId?: string
}): Promise<AvailableSlotResponse[]> => {
  const response = await api.get("/appointments/available-slots", { params })
  return unwrapResponse<AvailableSlotResponse[]>(response)
}

export const bookAppointmentApi = async (
  data: BookAppointmentRequest,
): Promise<AppointmentResponse> => {
  const response = await api.post("/appointments/owner/book", data)
  return unwrapResponse<AppointmentResponse>(response)
}

export const cancelAppointmentApi = async (
  appointmentId: string,
  data: CancelAppointmentRequest,
): Promise<AppointmentResponse> => {
  const response = await api.post(
    `/appointments/owner/${appointmentId}/cancel`,
    data,
  )
  return unwrapResponse<AppointmentResponse>(response)
}

export const rescheduleAppointmentApi = async (
  appointmentId: string,
  data: RescheduleAppointmentRequest,
): Promise<AppointmentResponse> => {
  const response = await api.post(
    `/appointments/owner/${appointmentId}/reschedule`,
    data,
  )
  return unwrapResponse<AppointmentResponse>(response)
}
