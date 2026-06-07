import { api } from "@/lib/axios"
import type {
  AppointmentListItemResponse,
  AppointmentResponse,
  CreateGuestWalkInIntakeRequest,
  GuestWalkInIntakeResponse,
} from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  const data = response.data as T | { data: T }
  if (data && typeof data === "object" && "data" in data) {
    return data.data
  }
  return data as T
}

// ==================== CLINIC APPOINTMENTS ====================

export const getClinicAppointmentsApi = async (params: {
  clinicId: string
  status?: string
  date?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ items: AppointmentListItemResponse[]; meta: { page: number; pageSize: number; totalRecords: number } }> => {
  const response = await api.get("/appointments", { params })
  const data = unwrapResponse<{
    Items?: AppointmentListItemResponse[]
    items?: AppointmentListItemResponse[]
    Meta?: { page?: number; pageNumber?: number; pageSize: number; totalRecords?: number; totalCount?: number }
    meta?: { page?: number; pageNumber?: number; pageSize: number; totalRecords?: number; totalCount?: number }
  }>(response)
  const meta = data.meta ?? data.Meta

  return {
    items: data.items ?? data.Items ?? [],
    meta: {
      page: meta?.page ?? meta?.pageNumber ?? params.page ?? 1,
      pageSize: meta?.pageSize ?? params.pageSize ?? 20,
      totalRecords: meta?.totalRecords ?? meta?.totalCount ?? 0,
    },
  }
}

export const confirmAppointmentApi = async (appointmentId: string): Promise<AppointmentResponse> => {
  const response = await api.post(`/appointments/${appointmentId}/confirm`, {})
  return unwrapResponse<AppointmentResponse>(response)
}

export const rejectAppointmentApi = async (
  appointmentId: string,
  data: { reason: string },
): Promise<AppointmentResponse> => {
  const response = await api.post(`/appointments/${appointmentId}/reject`, data)
  return unwrapResponse<AppointmentResponse>(response)
}

export const completeAppointmentApi = async (appointmentId: string): Promise<AppointmentResponse> => {
  const response = await api.post(`/appointments/${appointmentId}/complete`, {})
  return unwrapResponse<AppointmentResponse>(response)
}

export const noShowAppointmentApi = async (appointmentId: string): Promise<AppointmentResponse> => {
  const response = await api.post(`/appointments/${appointmentId}/no-show`, {})
  return unwrapResponse<AppointmentResponse>(response)
}

export const cancelAppointmentApi = async (
  appointmentId: string,
  data: { reason?: string },
): Promise<AppointmentResponse> => {
  const response = await api.post(`/appointments/${appointmentId}/cancel`, data)
  return unwrapResponse<AppointmentResponse>(response)
}

export const checkInAppointmentApi = async (
  appointmentId: string,
): Promise<AppointmentResponse> => {
  const response = await api.post(`/appointments/${appointmentId}/checkin`, {})
  return unwrapResponse<AppointmentResponse>(response)
}

export const checkInClinicAppointmentApi = async (
  appointmentId: string,
  clinicId: string,
): Promise<AppointmentResponse> => {
  const response = await api.post(`/appointments/${appointmentId}/checkin`, {}, { params: { clinicId } })
  return unwrapResponse<AppointmentResponse>(response)
}

export const createWalkInAppointmentApi = async (data: {
  clinicId: string
  petId: string
  vetClinicId?: string
  serviceId?: string
  appointmentDate: string
  startTime: string
  endTime: string
  appointmentType: string
  notes?: string
}): Promise<AppointmentResponse> => {
  const response = await api.post("/appointments/walk-in", data)
  return unwrapResponse<AppointmentResponse>(response)
}

export const createEmergencyAppointmentApi = async (data: {
  clinicId: string
  petId: string
  vetClinicId?: string
  serviceId?: string
  appointmentDate: string
  startTime: string
  endTime: string
  notes?: string
}): Promise<AppointmentResponse> => {
  const response = await api.post("/appointments/emergency", data)
  return unwrapResponse<AppointmentResponse>(response)
}

export const createGuestWalkInIntakeApi = async (
  data: CreateGuestWalkInIntakeRequest,
): Promise<GuestWalkInIntakeResponse> => {
  const response = await api.post("/appointments/walk-in/guest-intake", data)
  return unwrapResponse<GuestWalkInIntakeResponse>(response)
}

export const createGuestEmergencyIntakeApi = async (
  data: CreateGuestWalkInIntakeRequest,
): Promise<GuestWalkInIntakeResponse> => {
  const response = await api.post("/appointments/emergency/guest-intake", data)
  return unwrapResponse<GuestWalkInIntakeResponse>(response)
}
