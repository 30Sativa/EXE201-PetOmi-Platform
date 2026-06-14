import { api } from "@/lib/axios"
import { unwrapResponse } from "@/services/api-response"
import type {
  ClinicReviewResponse,
  ClinicReviewSummaryResponse,
  CreateClinicReviewRequest,
} from "@/types"

export const createClinicReviewApi = async (
  request: CreateClinicReviewRequest,
): Promise<ClinicReviewResponse> => {
  const response = await api.post("/clinic-reviews", request)
  return unwrapResponse<ClinicReviewResponse>(response)
}

export const getMyClinicReviewsApi = async (): Promise<ClinicReviewResponse[]> => {
  const response = await api.get("/clinic-reviews/mine")
  return unwrapResponse<ClinicReviewResponse[]>(response)
}

export const getClinicReviewsApi = async (
  clinicId: string,
): Promise<ClinicReviewSummaryResponse> => {
  const response = await api.get(`/clinic-reviews/clinic/${clinicId}`)
  return unwrapResponse<ClinicReviewSummaryResponse>(response)
}
