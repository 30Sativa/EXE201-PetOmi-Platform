import { api } from "@/lib/axios"
import { unwrapResponse } from "@/services/api-response"
import type {
  CreatePetHealthShareRequest,
  PetHealthShareResponse,
} from "@/types"

export const createPetHealthShareApi = async (
  petId: string,
  data: CreatePetHealthShareRequest,
): Promise<PetHealthShareResponse> => {
  const response = await api.post(`/pets/${petId}/health-shares`, data)
  return unwrapResponse<PetHealthShareResponse>(response)
}

export const getPetHealthSharesApi = async (
  petId: string,
): Promise<PetHealthShareResponse[]> => {
  const response = await api.get(`/pets/${petId}/health-shares`)
  const result = unwrapResponse<PetHealthShareResponse[]>(response)
  return Array.isArray(result) ? result : []
}

export const revokePetHealthShareApi = async (
  petId: string,
  shareTokenId: string,
): Promise<void> => {
  await api.delete(`/pets/${petId}/health-shares/${shareTokenId}`)
}
