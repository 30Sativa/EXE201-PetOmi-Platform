import { api } from "@/lib/axios"
import { unwrapResponse } from "@/services/api-response"
import type {
  AddPrescriptionItemRequest,
  CreateExaminationRequest,
  ExaminationResponse,
  PrescriptionItemResponse,
  UpdateExaminationRequest,
  UpdatePrescriptionItemRequest,
} from "@/types"

const isNotFound = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "response" in error &&
  (error as { response?: { status?: number } }).response?.status === 404

export const createExaminationApi = async (
  clinicId: string,
  data: CreateExaminationRequest,
): Promise<ExaminationResponse> => {
  const response = await api.post("/examinations", data, { params: { clinicId } })
  return unwrapResponse<ExaminationResponse>(response)
}

export const getExaminationByAppointmentApi = async (
  appointmentId: string,
): Promise<ExaminationResponse | null> => {
  try {
    const response = await api.get(`/examinations/by-appointment/${appointmentId}`)
    return unwrapResponse<ExaminationResponse>(response)
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export const updateExaminationApi = async (
  clinicId: string,
  examinationId: string,
  data: UpdateExaminationRequest,
): Promise<ExaminationResponse> => {
  const response = await api.put(`/examinations/${examinationId}`, data, { params: { clinicId } })
  return unwrapResponse<ExaminationResponse>(response)
}

export const completeExaminationApi = async (
  clinicId: string,
  examinationId: string,
): Promise<ExaminationResponse> => {
  const response = await api.post(`/examinations/${examinationId}/complete`, {}, { params: { clinicId } })
  return unwrapResponse<ExaminationResponse>(response)
}

export const getPrescriptionsApi = async (
  clinicId: string,
  examinationId: string,
): Promise<PrescriptionItemResponse[]> => {
  const response = await api.get(`/examinations/${examinationId}/prescriptions`, { params: { clinicId } })
  return unwrapResponse<PrescriptionItemResponse[]>(response)
}

export const addPrescriptionApi = async (
  clinicId: string,
  examinationId: string,
  data: AddPrescriptionItemRequest,
): Promise<PrescriptionItemResponse> => {
  const response = await api.post(`/examinations/${examinationId}/prescriptions`, data, { params: { clinicId } })
  return unwrapResponse<PrescriptionItemResponse>(response)
}

export const updatePrescriptionApi = async (
  clinicId: string,
  examinationId: string,
  prescriptionId: string,
  data: UpdatePrescriptionItemRequest,
): Promise<PrescriptionItemResponse> => {
  const response = await api.put(`/examinations/${examinationId}/prescriptions/${prescriptionId}`, data, { params: { clinicId } })
  return unwrapResponse<PrescriptionItemResponse>(response)
}

export const deletePrescriptionApi = async (
  clinicId: string,
  examinationId: string,
  prescriptionId: string,
): Promise<boolean> => {
  const response = await api.delete(`/examinations/${examinationId}/prescriptions/${prescriptionId}`, { params: { clinicId } })
  return unwrapResponse<boolean>(response)
}

