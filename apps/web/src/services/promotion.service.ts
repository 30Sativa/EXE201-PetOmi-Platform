import { api } from "@/lib/axios"
import { unwrapResponse } from "@/services/api-response"
import type {
  ActivateTrialResponse,
  PromotionOffersResponse,
  ReferralInfoResponse,
} from "@/types"

export const getPromotionOffersApi = async (): Promise<PromotionOffersResponse> => {
  const response = await api.get("/promotions/offers")
  return unwrapResponse<PromotionOffersResponse>(response)
}

export const getReferralInfoApi = async (): Promise<ReferralInfoResponse> => {
  const response = await api.get("/promotions/referral")
  return unwrapResponse<ReferralInfoResponse>(response)
}

export const activateTrialApi = async (): Promise<ActivateTrialResponse> => {
  const response = await api.post("/promotions/trial/activate")
  return unwrapResponse<ActivateTrialResponse>(response)
}
