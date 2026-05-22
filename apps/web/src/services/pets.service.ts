import { api } from "@/lib/axios"
import type {
  PetPhotoResponse,
  PetResponse,
  PetUserAccessResponse,
} from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any
  if ("data" in data && data.data != null) {
    return data.data
  }
  return data
}

// ==================== PETS ====================

export const getPetsApi = async (): Promise<PetResponse[]> => {
  const response = await api.get("/pets")
  const result = unwrapResponse<PetResponse[]>(response)
  return Array.isArray(result) ? result : []
}

export const getPetByIdApi = async (petId: string): Promise<PetResponse> => {
  const response = await api.get(`/pets/${petId}`)
  return unwrapResponse<PetResponse>(response)
}

export const createPetApi = async (
  data: FormData,
): Promise<PetResponse> => {
  const response = await api.post("/pets", data, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return unwrapResponse<PetResponse>(response)
}

export const updatePetApi = async (
  petId: string,
  data: FormData,
): Promise<PetResponse> => {
  const response = await api.put(`/pets/${petId}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return unwrapResponse<PetResponse>(response)
}

export const deletePetApi = async (petId: string): Promise<void> => {
  await api.delete(`/pets/${petId}`)
}

// ==================== PET HEALTH PROFILE ====================

export const getPetHealthProfileApi = async (
  petId: string,
): Promise<Record<string, unknown>> => {
  const response = await api.get(`/pets/${petId}/health-profile`)
  return unwrapResponse<Record<string, unknown>>(response)
}

export const createPetHealthProfileApi = async (
  petId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await api.post(`/pets/${petId}/health-profile`, data)
  return unwrapResponse<Record<string, unknown>>(response)
}

export const updatePetHealthProfileApi = async (
  petId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await api.put(`/pets/${petId}/health-profile`, data)
  return unwrapResponse<Record<string, unknown>>(response)
}

// ==================== PET WEIGHT LOGS ====================

export const getPetWeightLogsApi = async (
  petId: string,
): Promise<Record<string, unknown>[]> => {
  const response = await api.get(`/pets/${petId}/weight-logs`)
  return unwrapResponse<Record<string, unknown>[]>(response)
}

export const createPetWeightLogApi = async (
  petId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await api.post(`/pets/${petId}/weight-logs`, data)
  return unwrapResponse<Record<string, unknown>>(response)
}

// ==================== PET MEDICAL RECORDS ====================

export const getPetMedicalRecordsApi = async (
  petId: string,
): Promise<Record<string, unknown>[]> => {
  const response = await api.get(`/pets/${petId}/medical-records`)
  return unwrapResponse<Record<string, unknown>[]>(response)
}

export const createPetMedicalRecordApi = async (
  petId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await api.post(`/pets/${petId}/medical-records`, data)
  return unwrapResponse<Record<string, unknown>>(response)
}

// ==================== PET PHOTOS ====================

export const getPetPhotosApi = async (
  petId: string,
): Promise<PetPhotoResponse[]> => {
  const response = await api.get(`/pets/${petId}/photos`)
  return unwrapResponse<PetPhotoResponse[]>(response)
}

// ==================== PET ACCESS (SHARING) ====================

export const getPetAccessApi = async (
  petId: string,
): Promise<PetUserAccessResponse[]> => {
  const response = await api.get(`/pets/${petId}/access`)
  return unwrapResponse<PetUserAccessResponse[]>(response)
}

export const sharePetAccessApi = async (
  petId: string,
  data: Record<string, unknown>,
): Promise<PetUserAccessResponse> => {
  const response = await api.post(`/pets/${petId}/access`, data)
  return unwrapResponse<PetUserAccessResponse>(response)
}

export const revokePetAccessApi = async (
  petId: string,
  userId: string,
): Promise<void> => {
  await api.delete(`/pets/${petId}/access/${userId}`)
}
