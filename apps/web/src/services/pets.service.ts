import { api } from "@/lib/axios"
import type {
  CreatePetHealthProfileRequest,
  CreatePetMedicalRecordRequest,
  CreatePetPhotoRequest,
  CreatePetRequest,
  CreatePetWeightLogRequest,
  GrantPetAccessRequest,
  PetHealthProfileResponse,
  PetMedicalRecordResponse,
  PetPhotoResponse,
  PetResponse,
  PetUserAccessResponse,
  PetWeightLogResponse,
  SetPetAvatarRequest,
  UpdatePetAccessRequest,
  UpdatePetHealthProfileRequest,
  UpdatePetMedicalRecordRequest,
  UpdatePetPhotoRequest,
  UpdatePetRequest,
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
  data: CreatePetRequest,
): Promise<PetResponse> => {
  const response = await api.post("/pets", data)
  return unwrapResponse<PetResponse>(response)
}

export const updatePetApi = async (
  petId: string,
  data: UpdatePetRequest,
): Promise<PetResponse> => {
  const response = await api.put(`/pets/${petId}`, data)
  return unwrapResponse<PetResponse>(response)
}

export const deletePetApi = async (petId: string): Promise<void> => {
  await api.delete(`/pets/${petId}`)
}

// ==================== PET HEALTH PROFILE ====================

export const getPetHealthProfileApi = async (
  petId: string,
): Promise<PetHealthProfileResponse> => {
  const response = await api.get(`/pets/${petId}/health-profile`)
  return unwrapResponse<PetHealthProfileResponse>(response)
}

export const createPetHealthProfileApi = async (
  petId: string,
  data: CreatePetHealthProfileRequest,
): Promise<PetHealthProfileResponse> => {
  const response = await api.post(`/pets/${petId}/health-profile`, data)
  return unwrapResponse<PetHealthProfileResponse>(response)
}

export const updatePetHealthProfileApi = async (
  petId: string,
  data: UpdatePetHealthProfileRequest,
): Promise<PetHealthProfileResponse> => {
  const response = await api.put(`/pets/${petId}/health-profile`, data)
  return unwrapResponse<PetHealthProfileResponse>(response)
}

// ==================== PET WEIGHT LOGS ====================

export const getPetWeightLogsApi = async (
  petId: string,
): Promise<PetWeightLogResponse[]> => {
  const response = await api.get(`/pets/${petId}/weight-logs`)
  const result = unwrapResponse<PetWeightLogResponse[]>(response)
  return Array.isArray(result) ? result : []
}

export const createPetWeightLogApi = async (
  petId: string,
  data: CreatePetWeightLogRequest,
): Promise<PetWeightLogResponse> => {
  const response = await api.post(`/pets/${petId}/weight-logs`, data)
  return unwrapResponse<PetWeightLogResponse>(response)
}

export const deletePetWeightLogApi = async (
  petId: string,
  weightLogId: string,
): Promise<void> => {
  await api.delete(`/pets/${petId}/weight-logs/${weightLogId}`)
}

// ==================== PET MEDICAL RECORDS ====================

export const getPetMedicalRecordsApi = async (
  petId: string,
  recordType?: string,
): Promise<PetMedicalRecordResponse[]> => {
  const response = await api.get(`/pets/${petId}/medical-records`, {
    params: recordType ? { recordType } : undefined,
  })
  const result = unwrapResponse<PetMedicalRecordResponse[]>(response)
  return Array.isArray(result) ? result : []
}

export const createPetMedicalRecordApi = async (
  petId: string,
  data: CreatePetMedicalRecordRequest,
): Promise<PetMedicalRecordResponse> => {
  const response = await api.post(`/pets/${petId}/medical-records`, data)
  return unwrapResponse<PetMedicalRecordResponse>(response)
}

export const updatePetMedicalRecordApi = async (
  petId: string,
  medicalRecordId: string,
  data: UpdatePetMedicalRecordRequest,
): Promise<PetMedicalRecordResponse> => {
  const response = await api.put(
    `/pets/${petId}/medical-records/${medicalRecordId}`,
    data,
  )
  return unwrapResponse<PetMedicalRecordResponse>(response)
}

export const deletePetMedicalRecordApi = async (
  petId: string,
  medicalRecordId: string,
): Promise<void> => {
  await api.delete(`/pets/${petId}/medical-records/${medicalRecordId}`)
}

// ==================== PET PHOTOS ====================

export const getPetPhotosApi = async (
  petId: string,
): Promise<PetPhotoResponse[]> => {
  const response = await api.get(`/pets/${petId}/photos`)
  const result = unwrapResponse<PetPhotoResponse[]>(response)
  return Array.isArray(result) ? result : []
}

export const createPetPhotoApi = async (
  petId: string,
  data: CreatePetPhotoRequest,
): Promise<PetPhotoResponse> => {
  const response = await api.post(`/pets/${petId}/photos`, data)
  return unwrapResponse<PetPhotoResponse>(response)
}

export const updatePetPhotoApi = async (
  petId: string,
  photoId: string,
  data: UpdatePetPhotoRequest,
): Promise<PetPhotoResponse> => {
  const response = await api.put(`/pets/${petId}/photos/${photoId}`, data)
  return unwrapResponse<PetPhotoResponse>(response)
}

export const deletePetPhotoApi = async (
  petId: string,
  photoId: string,
): Promise<void> => {
  await api.delete(`/pets/${petId}/photos/${photoId}`)
}

export const setPetAvatarApi = async (
  petId: string,
  data: SetPetAvatarRequest,
): Promise<PetPhotoResponse> => {
  const response = await api.patch(`/pets/${petId}/avatar`, data)
  return unwrapResponse<PetPhotoResponse>(response)
}

// ==================== PET ACCESS (SHARING) ====================

export const getPetAccessApi = async (
  petId: string,
): Promise<PetUserAccessResponse[]> => {
  const response = await api.get(`/pets/${petId}/access`)
  const result = unwrapResponse<PetUserAccessResponse[]>(response)
  return Array.isArray(result) ? result : []
}

export const sharePetAccessApi = async (
  petId: string,
  data: GrantPetAccessRequest,
): Promise<PetUserAccessResponse> => {
  const response = await api.post(`/pets/${petId}/access`, data)
  return unwrapResponse<PetUserAccessResponse>(response)
}

export const updatePetAccessApi = async (
  petId: string,
  accessId: string,
  data: UpdatePetAccessRequest,
): Promise<PetUserAccessResponse> => {
  const response = await api.put(`/pets/${petId}/access/${accessId}`, data)
  return unwrapResponse<PetUserAccessResponse>(response)
}

export const revokePetAccessApi = async (
  petId: string,
  accessId: string,
): Promise<void> => {
  await api.delete(`/pets/${petId}/access/${accessId}`)
}
