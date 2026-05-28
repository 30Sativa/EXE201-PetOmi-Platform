import { api } from "@/lib/axios"
import type {
  AppointmentListItemResponse,
  AppointmentResponse,
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
  page?: number
  pageSize?: number
}): Promise<{ items: AppointmentListItemResponse[]; meta: { page: number; pageSize: number; totalRecords: number } }> => {
  const response = await api.get("/appointments", { params })
  return unwrapResponse<{ Items?: AppointmentListItemResponse[]; items?: AppointmentListItemResponse[]; meta?: { page: number; pageSize: number; totalRecords: number } }>(response) as { items: AppointmentListItemResponse[]; meta: { page: number; pageSize: number; totalRecords: number } }
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
