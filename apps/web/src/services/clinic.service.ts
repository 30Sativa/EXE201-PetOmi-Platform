import { api } from "@/lib/axios"
import type {
  ClinicSearchResult,
  ClinicServiceResponse,
  CreateClinicRequest,
  CreateClinicResponse,
  CreateVetProfileRequest,
  CreateVetProfileResponse,
  MyClinicResponse,
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
